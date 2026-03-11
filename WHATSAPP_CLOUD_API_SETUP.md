# WhatsApp Cloud API Integration Guide

هذا الدليل يشرح كيفية تكامل **WhatsApp Cloud API** من Meta مع مشروع SENDER، مع دعم كامل للأرقام من جنوب أفريقيا.

## ما الفرق بين Baileys و WhatsApp Cloud API؟

| الميزة | Baileys (الحالي) | WhatsApp Cloud API (الجديد) |
|--------|-----------------|------------------------|
| **النوع** | مكتبة غير رسمية | API رسمي من Meta |
| **الاستقرار** | عرضة للتغييرات | مستقر وموثوق |
| **المتطلبات** | حساب WhatsApp شخصي | حساب Business |
| **الدعم** | لا يوجد دعم رسمي | دعم رسمي من Meta |
| **الحدود** | محدودة | واضحة ومعروفة |
| **الأمان** | أقل أماناً | أكثر أماناً |

## خطوات الإعداد

### 1. إنشاء حساب Meta Business

1. اذهب إلى [Meta Business Suite](https://business.facebook.com/)
2. انقر على **Create Account** وأكمل العملية
3. تحقق من بريدك الإلكتروني

### 2. إعداد تطبيق WhatsApp

1. اذهب إلى [Meta Developers](https://developers.facebook.com/)
2. انقر على **Create App**
3. اختر **Business** كنوع التطبيق
4. ملأ التفاصيل الأساسية
5. انقر على **Create App**

### 3. إضافة منتج WhatsApp

1. في لوحة تحكم التطبيق، ابحث عن **WhatsApp**
2. انقر على **Set Up** أو **Add Product**
3. اختر **WhatsApp Business Platform**
4. اتبع الخطوات المرشدة

### 4. الحصول على بيانات الاعتماد

#### الحصول على Phone Number ID:

1. اذهب إلى **WhatsApp** > **Getting Started**
2. ستجد رقم الهاتف المعين لك
3. انقر على الرقم لعرض **Phone Number ID**
4. انسخ **Phone Number ID**

#### الحصول على Business Account ID:

1. اذهب إلى **Settings** > **Business Accounts**
2. انسخ **Business Account ID**

#### الحصول على Access Token:

1. اذهب إلى **Settings** > **User Access Tokens**
2. انقر على **Generate Token**
3. اختر الأذونات المطلوبة:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
4. انسخ التوكن الذي تم إنشاؤه

### 5. تكوين المتغيرات البيئية

أنشئ ملف `.env.local` في جذر المشروع:

```bash
# Google Sheets Configuration
GOOGLE_SERVICE_ACCOUNT_BASE64=your_base64_encoded_service_account
GOOGLE_SHEET_ID=your_google_sheet_id

# Authentication
DASHBOARD_PASSWORD=your_secure_password

# AI Configuration (Optional)
DEEPSEEK_API_KEY=your_deepseek_api_key

# WhatsApp Cloud API Configuration
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_ACCESS_TOKEN=your_access_token

# Webhook (Optional)
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token

# Node Environment
NODE_ENV=development
PORT=3000
```

## استخدام الخادم الجديد

### تشغيل الخادم مع WhatsApp Cloud API:

```bash
# تثبيت المكتبات
npm install

# تشغيل الخادم (يستخدم server-cloud-api.ts)
npm run dev
```

أو إذا كنت تريد استخدام ملف خادم مخصص:

```bash
# تحديث package.json لاستخدام server-cloud-api.ts
node server-cloud-api.ts
```

## دعم الأرقام من جنوب أفريقيا

تم تطوير الخدمة بدعم كامل للأرقام من جنوب أفريقيا:

### صيغ الأرقام المدعومة:

```javascript
// جميع هذه الصيغ تعمل:
'+27123456789'      // مع رمز الدولة
'0123456789'        // بدون رمز الدولة (يتم تحويله تلقائياً)
'27123456789'       // رمز الدولة بدون +
'(0) 123 456 789'   // مع فواصل
```

### تحويل الأرقام تلقائياً:

الخدمة تحول الأرقام تلقائياً:

```javascript
'0123456789' → '27123456789'  // إزالة 0 وإضافة 27
'0123456789' → '+27123456789' // الصيغة النهائية للـ API
```

## مثال على الاستخدام

### إرسال رسالة نصية:

```typescript
import { WhatsAppCloudAPI } from '@/lib/whatsapp-cloud-api';

const client = new WhatsAppCloudAPI(
  process.env.WHATSAPP_PHONE_NUMBER_ID!,
  process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
  process.env.WHATSAPP_ACCESS_TOKEN!
);

// إرسال رسالة إلى رقم من جنوب أفريقيا
const messageId = await client.sendMessage(
  '0123456789', // أو '+27123456789'
  'مرحباً! هذه رسالة اختبار من WhatsApp Cloud API'
);

console.log('Message sent with ID:', messageId);
```

### إرسال رسالة قالب (Template):

```typescript
const messageId = await client.sendTemplateMessage(
  '0123456789',
  'hello_world',
  {
    name: 'أحمد',
    company: 'بتروتريد'
  }
);
```

## التحقق من حالة الرسالة

```typescript
const status = await client.getMessageStatus(messageId);
console.log('Message status:', status);
// الحالات الممكنة: 'accepted', 'pending', 'sent', 'delivered', 'read', 'failed'
```

## معالجة الأخطاء

```typescript
try {
  const messageId = await client.sendMessage('0123456789', 'رسالة');
} catch (error) {
  if (error.message.includes('Invalid phone number')) {
    console.error('رقم الهاتف غير صحيح');
  } else if (error.message.includes('Unauthorized')) {
    console.error('توكن الوصول غير صحيح أو منتهي الصلاحية');
  } else {
    console.error('خطأ عام:', error.message);
  }
}
```

## حدود الخدمة

### معدل الإرسال:

- **الحد الأقصى**: 1000 رسالة في الساعة
- **الحد الأقصى للدفعة**: 100 رسالة في الطلب الواحد

### الرسائل المدعومة:

- ✅ رسائل نصية
- ✅ قوالب مسبقة الموافقة
- ✅ رسائل الوسائط (صور، فيديو، ملفات)
- ✅ الرسائل التفاعلية (أزرار، قوائم)

### الأرقام المدعومة:

- ✅ أرقام من جنوب أفريقيا (+27)
- ✅ أرقام من دول أخرى
- ✅ أرقام بصيغ مختلفة

## استكشاف الأخطاء

### خطأ: "Invalid phone number format"

**السبب**: صيغة الرقم غير صحيحة

**الحل**:
```javascript
// استخدم أحد هذه الصيغ:
'+27123456789'    // الأفضل
'0123456789'      // سيتم تحويله تلقائياً
'27123456789'     // بدون +
```

### خطأ: "Unauthorized"

**السبب**: التوكن غير صحيح أو منتهي الصلاحية

**الحل**:
1. تحقق من `WHATSAPP_ACCESS_TOKEN` في `.env.local`
2. أعد إنشاء التوكن من Meta Developers
3. تأكد من أن التوكن لم ينتهِ

### خطأ: "Phone number not registered"

**السبب**: الرقم لم يتم تسجيله على WhatsApp

**الحل**:
1. تأكد من أن الرقم صحيح
2. تأكد من أن الرقم مسجل على WhatsApp
3. انتظر 24 ساعة بعد تسجيل الرقم

## الميزات المتقدمة

### إعادة محاولة الإرسال:

```typescript
async function sendWithRetry(phone: string, message: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.sendMessage(phone, message);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### معالجة الرسائل الواردة (Webhooks):

```typescript
// في app/api/whatsapp/webhook/route.ts
export async function POST(req: NextRequest) {
  const body = await req.json();
  
  if (body.entry?.[0]?.changes?.[0]?.value?.messages) {
    const messages = body.entry[0].changes[0].value.messages;
    
    for (const message of messages) {
      console.log('Received message:', message.text?.body);
      // معالجة الرسالة
    }
  }
  
  return NextResponse.json({ success: true });
}
```

## الموارد الإضافية

- [توثيق WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Meta Business Platform](https://business.facebook.com/)
- [Meta Developers](https://developers.facebook.com/)
- [أرقام جنوب أفريقيا](https://en.wikipedia.org/wiki/Telephone_numbers_in_South_Africa)

## الدعم والمساعدة

إذا واجهت أي مشاكل:

1. تحقق من المتغيرات البيئية
2. راجع رسائل الخطأ في السجلات
3. تأكد من أن الحساب لديه الأذونات المطلوبة
4. اتصل بـ Meta Support للمشاكل المتعلقة بـ API
