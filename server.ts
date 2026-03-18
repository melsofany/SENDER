import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { getSheetData, updateSheetCell } from './lib/google-sheets.ts';
import { createWhatsAppClient } from './lib/whatsapp-cloud-api.ts';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// WhatsApp Client
const waClient = createWhatsAppClient();

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
  const data = await getSheetData(SPREADSHEET_ID, 'Sheet1!A2:C');
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

async function processMessages(customTemplate?: string) {
  if (isSending) return;
  isSending = true;
  currentAction = 'جاري جلب الأرقام...';
  
  try {
    const numbers = await getNumbersToNotify();
    
    for (const item of numbers) {
      if (!isSending) break;
      
      if (messagesSentInBatch >= BATCH_SIZE) {
        currentAction = `تم إرسال ${BATCH_SIZE} رسالة. فترة راحة لمدة 30 دقيقة لتجنب الحظر...`;
        await new Promise(resolve => setTimeout(resolve, PAUSE_DURATION));
        messagesSentInBatch = 0;
      }
      
      try {
        currentAction = `جاري صياغة الرسالة للعميل ${item.name || item.phone}...`;
        const messageText = await generateMessageVariation(item.name, customTemplate);
        
        currentAction = `جاري إرسال الرسالة إلى ${item.phone}...`;
        await waClient.sendMessage(item.phone, messageText);
        
        await updateStatus(item.rowIndex, 'تم الارسال');
        messagesSentInBatch++;
        
        const delay = Math.floor(Math.random() * (90000 - 30000 + 1)) + 30000;
        currentAction = `تم الإرسال. انتظار ${Math.round(delay/1000)} ثانية قبل الرقم التالي...`;
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        console.error(`Failed to send to ${item.phone}:`, error);
        await updateStatus(item.rowIndex, 'فشل الارسال');
      }
    }
    currentAction = 'تم الانتهاء من إرسال جميع الرسائل.';
  } catch (error) {
    console.error('Error in processMessages:', error);
    currentAction = 'حدث خطأ أثناء الإرسال.';
  } finally {
    isSending = false;
  }
}

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      const { pathname, query } = parsedUrl;

      if (pathname === '/api/whatsapp') {
        const action = query.action;
        res.setHeader('Content-Type', 'application/json');

        if (action === 'status') {
          res.statusCode = 200;
          res.end(JSON.stringify({ 
            status: 'open', // Always open since it's API based
            qr: null,
            isSending,
            currentAction
          }));
          return;
        }

        if (action === 'connect') {
          res.statusCode = 200;
          res.end(JSON.stringify({ message: 'API Client is always connected' }));
          return;
        }

        if (action === 'start') {
          if (isSending) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Already sending' }));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
              try {
                const data = JSON.parse(body || '{}');
                processMessages(data.template);
                res.statusCode = 200;
                res.end(JSON.stringify({ message: 'Ready to send' }));
              } catch (e) {
                processMessages();
                res.statusCode = 200;
                res.end(JSON.stringify({ message: 'Ready to send (default template)' }));
              }
            });
          } else {
            processMessages();
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
