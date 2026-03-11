import { NextRequest, NextResponse } from 'next/server';
import { getNumbersToNotify, updateStatus } from '@/app/actions';

const MESSAGE_TEMPLATE = `السيد / العميل الكريم

إنذار قانوني نهائي

بمراجعة سجلات الحساب لدى شركة بتروتريد تبين وجود مديونية مستحقة عليكم مقابل استهلاك الغاز الطبيعي، ولم يتم سدادها حتى تاريخه رغم التنبيهات والمطالبات السابقة.

وعليه يعتبر هذا الإخطار **إنذارًا قانونيًا نهائيًا وأخيرًا** بضرورة سداد كامل المديونية خلال مدة أقصاها **48 ساعة من تاريخ استلام هذه الرسالة**.

وفي حالة عدم السداد خلال المهلة المحددة، ستقوم الشركة فورًا ودون أي إخطار آخر باتخاذ كافة الإجراءات القانونية المقررة قانونًا، والتي تشمل على سبيل المثال لا الحصر:

• تحرير محضر ورفع **جنحة تبديد مواد بترولية** ضد سيادتكم.
• استبدال العداد الحالي بعداد **مسبق الدفع (كارت)** طبقًا للوائح المنظمة.
• تحميل العميل **كامل تكلفة العداد الجديد ومصاريف التركيب والإجراءات**، على أن يتم خصمها من عمليات شحن العداد.
• اتخاذ الإجراءات القضائية اللازمة لتحصيل المديونية مع **إلزامكم بالمصاريف القضائية وأتعاب المحاماة**.

لذا نهيب بسيادتكم سرعة التوجه إلى مقر الشركة أو التواصل فورًا لتسوية المديونية تفاديًا لاتخاذ الإجراءات القانونية.

العنوان: ش. شكري القواتلي – مول أبو هارون – الدور الثالث علوي
شركة بتروتريد
إدارة التحصيل`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  const connectionStatus = (global as any).waConnectionStatus || 'none';
  const qrCode = (global as any).waQrCode || null;
  const sock = (global as any).waSocket || null;

  if (action === 'status') {
    return NextResponse.json({ status: connectionStatus, qr: qrCode });
  }

  if (action === 'connect') {
    // The actual connection logic is handled in server.ts
    // We just trigger it by returning a message
    return NextResponse.json({ message: 'Connection initiated' });
  }

  if (action === 'start') {
    if (connectionStatus !== 'open' || !sock) {
      return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 400 });
    }
    processMessages(sock);
    return NextResponse.json({ message: 'Sending process started' });
  }

  if (action === 'stop') {
    (global as any).isSending = false;
    return NextResponse.json({ message: 'Sending process stopped' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  const connectionStatus = (global as any).waConnectionStatus || 'none';
  const sock = (global as any).waSocket || null;

  if (action === 'start') {
    if (connectionStatus !== 'open' || !sock) {
      return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 400 });
    }
    
    try {
      const body = await req.json();
      const template = body.template || MESSAGE_TEMPLATE;
      processMessages(sock, template);
      return NextResponse.json({ message: 'Sending process started' });
    } catch (e) {
      processMessages(sock, MESSAGE_TEMPLATE);
      return NextResponse.json({ message: 'Sending process started with default template' });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

async function processMessages(sock: any, template: string = MESSAGE_TEMPLATE) {
  // This is a fallback. Ideally server.ts handles this.
  // We'll just use the template directly here without AI to avoid duplicate AI logic
  // and potential meta-talk issues in this fallback route.
  const numbers = await getNumbersToNotify();
  (global as any).isSending = true;
  
  for (const item of numbers) {
    if (!(global as any).isSending) break;
    
    try {
      let cleanPhone = item.phone.replace(/\D/g, '');
      if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
        cleanPhone = '2' + cleanPhone;
      } else if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
        cleanPhone = '27' + cleanPhone.substring(1);
      }
      
      if (!cleanPhone.includes('@s.whatsapp.net')) {
        cleanPhone = `${cleanPhone}@s.whatsapp.net`;
      }

      // Just simple name replacement for the fallback route
      const messageText = template.replace(/العميل الكريم/g, item.name || 'العميل الكريم');

      await sock.sendMessage(cleanPhone, { text: messageText });
      await updateStatus(item.rowIndex, 'تم الارسال');
      await new Promise(resolve => setTimeout(resolve, 30000 + Math.random() * 30000));
    } catch (error) {
      console.error(`Failed to send to ${item.phone}:`, error);
      await updateStatus(item.rowIndex, 'فشل الارسال');
    }
  }
  
  (global as any).isSending = false;
}
