# SENDER - نظام الإخطارات القانونية الذكي
## مع دعم WhatsApp Cloud API وأرقام جنوب أفريقيا

**SENDER** هو نظام متقدم لإرسال الإخطارات القانونية عبر WhatsApp بشكل آلي وآمن، مع دعم كامل لـ **WhatsApp Cloud API** من Meta وأرقام من **جنوب أفريقيا**.

## الميزات الرئيسية

✨ **WhatsApp Cloud API الرسمي**
- تكامل مباشر مع Meta's WhatsApp Business Platform
- أكثر استقراراً وأماناً من المكتبات غير الرسمية
- دعم رسمي من Meta

🌍 **دعم جنوب أفريقيا**
- تحويل تلقائي للأرقام من صيغ مختلفة
- دعم الأرقام بدون رمز الدولة (0XXXXXXXXX)
- دعم الأرقام برمز الدولة (+27XXXXXXXXX)

🤖 **صياغة ذكية للرسائل**
- تكامل مع DeepSeek AI لإعادة صياغة الرسائل
- تجنب حظر WhatsApp من خلال تنويع الرسائل
- الحفاظ على القوة القانونية للرسائل

📊 **لوحة تحكم حديثة**
- واجهة مستخدم جميلة وسهلة الاستخدام
- تتبع حالة الرسائل في الوقت الفعلي
- إحصائيات شاملة

🔐 **أمان عالي**
- حماية بكلمة مرور
- تشفير البيانات
- دعم متغيرات البيئة

## المتطلبات

- **Node.js** 18+ و **npm** أو **yarn**
- **حساب Meta Business** (للحصول على WhatsApp Cloud API)
- **Google Sheets** (لتخزين الأرقام والرسائل)
- **DeepSeek API** (اختياري - لإعادة الصياغة الذكية)

## التثبيت السريع

### 1. استنساخ المشروع

```bash
git clone https://github.com/melsofany/SENDER.git
cd SENDER
```

### 2. تثبيت المكتبات

```bash
npm install
```

### 3. إعداد المتغيرات البيئية

انسخ `.env.example` إلى `.env.local` وملأ البيانات:

```bash
cp .env.example .env.local
```

ثم عدّل `.env.local`:

```bash
# Google Sheets
GOOGLE_SERVICE_ACCOUNT_BASE64=your_base64_encoded_service_account
GOOGLE_SHEET_ID=your_google_sheet_id

# Authentication
DASHBOARD_PASSWORD=your_secure_password

# WhatsApp Cloud API (من Meta Developers)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_ACCESS_TOKEN=your_access_token

# DeepSeek AI (اختياري)
DEEPSEEK_API_KEY=your_deepseek_api_key

# Node Environment
NODE_ENV=development
PORT=3000
```

### 4. تشغيل المشروع

```bash
npm run dev
```

ثم افتح المتصفح على `http://localhost:3000`

## إعداد WhatsApp Cloud API

اتبع الخطوات المفصلة في [WHATSAPP_CLOUD_API_SETUP.md](./WHATSAPP_CLOUD_API_SETUP.md)

## إعداد Google Sheets

### 1. إنشاء جدول بيانات

1. اذهب إلى [Google Sheets](https://sheets.google.com)
2. أنشئ جدول بيانات جديد
3. أضف الأعمدة التالية:
   - **العمود A**: رقم الهاتف (Phone Number)
   - **العمود B**: اسم العميل (Customer Name)
   - **العمود C**: حالة الإرسال (Status)

### 2. الحصول على معرّف الجدول

انسخ معرّف الجدول من عنوان URL:
```
https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
                                        ^^^^^^^^
```

### 3. إعداد حساب الخدمة

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. أنشئ مشروع جديد
3. فعّل Google Sheets API
4. أنشئ Service Account
5. أنزّل JSON key وحوّله إلى Base64:

```bash
cat service-account.json | base64
```

6. ضع النتيجة في `GOOGLE_SERVICE_ACCOUNT_BASE64`

## أمثلة الاستخدام

### إرسال رسالة إلى رقم من جنوب أفريقيا

```typescript
import { WhatsAppCloudAPI } from '@/lib/whatsapp-cloud-api';

const client = new WhatsAppCloudAPI(
  process.env.WHATSAPP_PHONE_NUMBER_ID!,
  process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
  process.env.WHATSAPP_ACCESS_TOKEN!
);

// جميع هذه الصيغ تعمل:
await client.sendMessage('0123456789', 'مرحباً!');
await client.sendMessage('+27123456789', 'مرحباً!');
await client.sendMessage('27123456789', 'مرحباً!');
```

### إرسال رسائل جماعية

1. افتح لوحة التحكم على `http://localhost:3000`
2. أدخل كلمة المرور
3. انقر على **Connect WhatsApp**
4. انقر على **Start Campaign**

## هيكل المشروع

```
SENDER/
├── app/
│   ├── api/
│   │   └── whatsapp/
│   │       ├── route.ts              # API endpoints
│   │       └── webhook/
│   │           └── route.ts          # Webhook handler
│   ├── actions.ts                    # Server actions
│   ├── page.tsx                      # Dashboard UI
│   └── layout.tsx                    # Layout
├── lib/
│   ├── google-sheets.ts              # Google Sheets integration
│   └── whatsapp-cloud-api.ts         # WhatsApp Cloud API client
├── server.ts                         # Server with Baileys (قديم)
├── server-cloud-api.ts               # Server with Cloud API (جديد)
├── WHATSAPP_CLOUD_API_SETUP.md       # Setup guide
└── README.md                         # This file
```

## الملفات الجديدة

| الملف | الوصف |
|------|-------|
| `lib/whatsapp-cloud-api.ts` | خدمة WhatsApp Cloud API مع دعم جنوب أفريقيا |
| `server-cloud-api.ts` | خادم بديل يستخدم Cloud API بدلاً من Baileys |
| `app/api/whatsapp/webhook/route.ts` | معالج Webhook لاستقبال الرسائل |
| `WHATSAPP_CLOUD_API_SETUP.md` | دليل إعداد مفصل |
| `.env.example` | متغيرات البيئة المحدثة |

## حدود الخدمة

### معدل الإرسال

- **الحد الأقصى**: 1000 رسالة/ساعة
- **الفترة الراحة**: 30 دقيقة بعد كل 20 رسالة

### الأرقام المدعومة

- ✅ أرقام جنوب أفريقيا (+27)
- ✅ أرقام من دول أخرى
- ✅ صيغ مختلفة (مع/بدون رمز الدولة)

## استكشاف الأخطاء

### خطأ: "Invalid phone number format"

**الحل**: استخدم أحد الصيغ الصحيحة:
```
+27123456789  (الأفضل)
0123456789    (سيتم تحويله تلقائياً)
27123456789   (بدون +)
```

### خطأ: "Unauthorized"

**الحل**: تحقق من:
1. `WHATSAPP_ACCESS_TOKEN` في `.env.local`
2. أن التوكن لم ينتهِ
3. أعد إنشاء التوكن من Meta Developers

### خطأ: "Phone number not registered"

**الحل**:
1. تأكد من أن الرقم صحيح
2. تأكد من أن الرقم مسجل على WhatsApp
3. انتظر 24 ساعة بعد التسجيل

## المقارنة بين الخوادم

### استخدام Baileys (server.ts - القديم)

```bash
npm run dev
# أو
node server.ts
```

**المميزات**:
- لا يتطلب حساب Business
- يعمل مع أي حساب WhatsApp شخصي

**العيوب**:
- غير رسمي وعرضة للتغييرات
- قد يتم حظر الحساب
- لا يوجد دعم رسمي

### استخدام Cloud API (server-cloud-api.ts - الجديد)

```bash
node server-cloud-api.ts
```

**المميزات**:
- رسمي وموثوق
- دعم رسمي من Meta
- أكثر أماناً
- حدود واضحة

**العيوب**:
- يتطلب حساب Business
- يتطلب موافقة من Meta

## الميزات المستقبلية

- 📱 تطبيق موبايل
- 🔔 إشعارات فورية
- 📈 تحليلات متقدمة
- 🌐 دعم لغات متعددة
- 🎯 استهداف متقدم

## المساهمة

نرحب بمساهماتك! يرجى:

1. Fork المشروع
2. أنشئ فرع جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى الفرع (`git push origin feature/amazing-feature`)
5. Open Pull Request

## الترخيص

هذا المشروع مرخص تحت MIT License - انظر ملف [LICENSE](LICENSE) للتفاصيل.

## الدعم

للمساعدة والدعم:

1. تحقق من [WHATSAPP_CLOUD_API_SETUP.md](./WHATSAPP_CLOUD_API_SETUP.md)
2. راجع [توثيق Meta](https://developers.facebook.com/docs/whatsapp/cloud-api)
3. افتح Issue على GitHub

## الشكر والتقدير

شكر خاص لـ:
- Meta لـ WhatsApp Cloud API
- Google لـ Google Sheets API
- DeepSeek لـ AI API

---

**تم التطوير بـ ❤️ بواسطة فريق SENDER**

آخر تحديث: مارس 2026
