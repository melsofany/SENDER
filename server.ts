import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import * as baileys from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { getSheetData, updateSheetCell } from './lib/google-sheets.ts';

const makeWASocket = (baileys as any).default?.makeWASocket || (baileys as any).makeWASocket || (baileys as any).default || baileys;
const {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} = baileys;

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// WhatsApp State
let sock: any = null;
let qrCode: string | null = null;
let connectionStatus: 'connecting' | 'open' | 'close' | 'none' = 'none';
const logger = pino({ level: 'silent' });

// Sending State
let isSending = false;
let currentAction = 'متوقف';
let messagesSentInBatch = 0;
const BATCH_SIZE = 20;
const PAUSE_DURATION = 30 * 60 * 1000; // 30 minutes

const PROCEDURES = `وفي حالة عدم السداد خلال المهلة المحددة، ستقوم الشركة فورًا ودون أي إخطار آخر باتخاذ كافة الإجراءات القانونية المقررة قانونًا، والتي تشمل على سبيل المثال لا الحصر:

• تحرير محضر ورفع **جنحة تبديد مواد بترولية** ضد سيادتكم.
• استبدال العداد الحالي بعداد **مسبق الدفع (كارت)** طبقًا للوائح المنظمة.
• تحميل العميل **كامل تكلفة العداد الجديد ومصاريف التركيب والإجراءات**، على أن يتم خصمها من عمليات شحن العداد.
• اتخاذ الإجراءات القضائية اللازمة لتحصيل المديونية مع **إلزامكم بالمصاريف القضائية وأتعاب المحاماة**.`;

const ADDRESS = `العنوان: ش. شكري القواتلي – مول أبو هارون – الدور الثالث علوي
شركة بتروتريد
إدارة التحصيل`;

const MESSAGE_TEMPLATE = `السيد / العميل الكريم

إنذار قانوني نهائي

بمراجعة سجلات الحساب لدى شركة بتروتريد تبين وجود مديونية مستحقة عليكم مقابل استهلاك الغاز الطبيعي، ولم يتم سدادها حتى تاريخه رغم التنبيهات والمطالبات السابقة.

وعليه يعتبر هذا الإخطار **إنذارًا قانونيًا نهائيًا وأخيرًا** بضرورة سداد كامل المديونية خلال مدة أقصاها **48 ساعة من تاريخ استلام هذه الرسالة**.

${PROCEDURES}

لذا نهيب بسيادتكم سرعة التوجه إلى مقر الشركة أو التواصل فورًا لتسوية المديونية تفاديًا لاتخاذ الإجراءات القانونية.

${ADDRESS}`;

async function generateMessageVariation(name: string, customTemplate?: string) {
  const baseTemplate = customTemplate || MESSAGE_TEMPLATE;
  
  // If no AI key, just replace the name and return
  if (!process.env.DEEPSEEK_API_KEY) {
    return baseTemplate.replace(/العميل الكريم/g, name || 'العميل الكريم');
  }
  
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `أنت خبير صياغة قانونية لشركة بتروتريد. مهمتك إعادة صياغة الرسالة التي سيزودك بها المستخدم لتكون فريدة لغوياً مع الحفاظ على كامل القوة القانونية والمعلومات.
            
قواعد العمل:
1. ممنوع منعاً باتاً ذكر أي شيء عن "إعادة الصياغة" أو "تجنب الحظر" أو "الذكاء الاصطناعي" أو "واتساب" داخل نص الرسالة.
2. حافظ على كافة المواعيد (48 ساعة) والبيانات القانونية والعناوين كما هي تماماً دون أي تغيير.
3. ابدأ الرسالة بـ "السيد / ${name || 'العميل الكريم'}".
4. أرجع نص الرسالة النهائي فقط. لا تضف أي تعليقات قبل أو بعد النص.`
          },
          {
            role: 'user',
            content: `النص المطلوب إعادة صياغته:\n${baseTemplate}`
          }
        ],
        temperature: 0.6
      })
    });

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      let content = data.choices[0].message.content.trim();
      
      // Aggressive cleaning of AI meta-talk
      const phrasesToRemove = [
        /إليك الرسالة بعد إعادة الصياغة:/g,
        /تفضل الصياغة الجديدة:/g,
        /الرسالة الجديدة:/g,
        /نص الرسالة:/g,
        /صياغة قانونية:/g,
        /تجنب حظر واتساب/g,
        /حظر واتساب/g,
        /تجنب الحظر/g,
        /إعادة صياغة/g,
        /لحماية حسابك/g,
        /من أجل تجنب الحظر/g,
        /هذه هي الرسالة:/g,
        /الصياغة الجديدة/g
      ];
      
      phrasesToRemove.forEach(regex => {
        content = content.replace(regex, '');
      });

      return content.trim();
    }
  } catch (error) {
    console.error('DeepSeek API error:', error);
  }
  
  return baseTemplate.replace(/العميل الكريم/g, name || 'العميل الكريم');
}

async function getNumbersToNotify() {
  const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!;
  console.log('SPREADSHEET_ID in getNumbersToNotify:', SPREADSHEET_ID);
  const data = await getSheetData(SPREADSHEET_ID, 'Sheet1!A2:C');
  console.log('Data fetched from sheets:', data?.length);
  return data
    .map((row: any, index: number) => ({
      rowIndex: index + 2,
      phone: row[0], // Column A
      name: row[1], // Column B
      status: row[2] || '', // Column C
    }))
    .filter((item: any) => item.phone && item.status !== 'تم الارسال');
}

async function updateStatus(rowIndex: number, status: string) {
  const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!;
  await updateSheetCell(SPREADSHEET_ID, `Sheet1!C${rowIndex}`, status);
}

async function processMessages(sock: any, customTemplate?: string) {
  if (isSending) return;
  isSending = true;
  currentAction = 'جاري جلب الأرقام...';
  console.log('Starting to process messages...');
  
  try {
    const numbers = await getNumbersToNotify();
    console.log(`Found ${numbers.length} numbers to notify.`);
    
    for (const item of numbers) {
      if (!isSending) break; // Allow stopping
      
      if (messagesSentInBatch >= BATCH_SIZE) {
        currentAction = `تم إرسال ${BATCH_SIZE} رسالة. فترة راحة لمدة 30 دقيقة لتجنب الحظر...`;
        await new Promise(resolve => setTimeout(resolve, PAUSE_DURATION));
        messagesSentInBatch = 0;
      }
      
      try {
        currentAction = `جاري صياغة الرسالة للعميل ${item.name || item.phone}...`;
        console.log(`Processing number: ${item.phone}`);
        const messageText = await generateMessageVariation(item.name, customTemplate);
        
        let cleanPhone = item.phone.replace(/\D/g, '');
        // Handle Egyptian numbers (start with 01)
        if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
          cleanPhone = '2' + cleanPhone;
        } 
        // Handle South African numbers (start with 0 and not 01, or 10 digits)
        else if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
          cleanPhone = '27' + cleanPhone.substring(1);
        }
        // If it's already 11 digits starting with 27, it's a SA number with country code
        // If it's already 12 digits starting with 20, it's an Egyptian number with country code
        
        if (!cleanPhone.includes('@s.whatsapp.net')) {
          cleanPhone = `${cleanPhone}@s.whatsapp.net`;
        }

        currentAction = `جاري إرسال الرسالة إلى ${cleanPhone}...`;
        console.log(`Sending message to ${cleanPhone}...`);
        await sock.sendMessage(cleanPhone, { text: messageText });
        
        console.log(`Message sent to ${cleanPhone}. Updating status...`);
        await updateStatus(item.rowIndex, 'تم الارسال');
        
        messagesSentInBatch++;
        
        const delay = Math.floor(Math.random() * (90000 - 30000 + 1)) + 30000;
        currentAction = `تم الإرسال. انتظار ${Math.round(delay/1000)} ثانية قبل الرقم التالي...`;
        console.log(`Status updated for ${cleanPhone}. Waiting ${Math.round(delay/1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        console.error(`Failed to send to ${item.phone}:`, error);
        await updateStatus(item.rowIndex, 'فشل الارسال');
      }
    }
    currentAction = 'تم الانتهاء من إرسال جميع الرسائل.';
    console.log('Finished processing all messages.');
  } catch (error) {
    console.error('Error in processMessages:', error);
    currentAction = 'حدث خطأ أثناء الإرسال.';
  } finally {
    isSending = false;
  }
}

async function connectToWhatsApp() {
  try {
    const authPath = path.join(process.cwd(), 'whatsapp_auth_info');
    if (!fs.existsSync(authPath)) {
      fs.mkdirSync(authPath, { recursive: true });
    }
    
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      logger,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      printQRInTerminal: false,
    });

    sock.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        qrCode = await QRCode.toDataURL(qr);
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        connectionStatus = 'close';
        qrCode = null;
        if (shouldReconnect) {
          setTimeout(connectToWhatsApp, 5000);
        } else {
          // If logged out, delete auth info
          fs.rmSync(authPath, { recursive: true, force: true });
        }
      } else if (connection === 'open') {
        connectionStatus = 'open';
        qrCode = null;
      } else if (connection) {
        connectionStatus = connection;
      }
    });

    sock.ev.on('creds.update', saveCreds);
  } catch (error) {
    console.error('Failed to initialize WhatsApp socket:', error);
    connectionStatus = 'close';
  }
}

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      const { pathname, query } = parsedUrl;

      // Intercept WhatsApp API calls
      if (pathname === '/api/whatsapp') {
        const action = query.action;
        res.setHeader('Content-Type', 'application/json');

        if (action === 'status') {
          res.statusCode = 200;
          res.end(JSON.stringify({ 
            status: connectionStatus, 
            qr: qrCode,
            isSending,
            currentAction
          }));
          return;
        }

        if (action === 'connect') {
          if (connectionStatus !== 'open' && connectionStatus !== 'connecting') {
            connectToWhatsApp();
          }
          res.statusCode = 200;
          res.end(JSON.stringify({ message: 'Connection initiated' }));
          return;
        }

        if (action === 'start') {
          if (connectionStatus !== 'open' || !sock) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'WhatsApp not connected' }));
            return;
          }
          
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
              try {
                const data = JSON.parse(body || '{}');
                const templateToUse = data.template || null;
                console.log('Starting campaign. Template source:', templateToUse ? 'Custom (Length: ' + templateToUse.length + ')' : 'Default');
                
                // If already sending, we might want to stop it first or just ignore
                if (isSending) {
                  console.log('Already sending, ignoring start request');
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Already sending' }));
                  return;
                }

                processMessages(sock, templateToUse);
                res.statusCode = 200;
                res.end(JSON.stringify({ message: 'Ready to send' }));
              } catch (e) {
                console.error('Failed to parse POST body:', e);
                processMessages(sock);
                res.statusCode = 200;
                res.end(JSON.stringify({ message: 'Ready to send (default template)' }));
              }
            });
          } else {
            console.log('Starting campaign with default template (GET request)');
            processMessages(sock);
            res.statusCode = 200;
            res.end(JSON.stringify({ message: 'Ready to send' }));
          }
          return;
        }
        
        if (action === 'stop') {
          isSending = false;
          currentAction = 'تم إيقاف الإرسال.';
          res.statusCode = 200;
          res.end(JSON.stringify({ message: 'Stopped sending' }));
          return;
        }
      }

      // Expose socket globally for Next.js API routes to use
      (global as any).waSocket = sock;
      (global as any).waConnectionStatus = connectionStatus;
      (global as any).waQrCode = qrCode;

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
