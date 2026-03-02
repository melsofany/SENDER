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

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

async function processMessages(sock: any) {
  const numbers = await getNumbersToNotify();
  for (const item of numbers) {
    try {
      let cleanPhone = item.phone.replace(/\D/g, '');
      if (cleanPhone.startsWith('01')) {
        cleanPhone = '2' + cleanPhone;
      }
      if (!cleanPhone.includes('@s.whatsapp.net')) {
        cleanPhone = `${cleanPhone}@s.whatsapp.net`;
      }

      await sock.sendMessage(cleanPhone, { text: MESSAGE_TEMPLATE });
      await updateStatus(item.rowIndex, 'تم الارسال');
      await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 5000));
    } catch (error) {
      console.error(`Failed to send to ${item.phone}:`, error);
      await updateStatus(item.rowIndex, 'فشل الارسال');
    }
  }
}
