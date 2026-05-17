# دليل نشر منصة TradeXRay على Vercel

تم إعداد منصة TradeXRay بالكامل للنشر السلس على منصة Vercel. يغطي هذا الدليل جميع الخطوات اللازمة، المتغيرات البيئية المطلوبة، وإعدادات النشر لضمان عمل المنصة (الواجهة الأمامية والخلفية) بكفاءة عالية.

---

## 1. المتطلبات المسبقة (Prerequisites)

قبل البدء في النشر، تأكد من توفر الحسابات والبيانات التالية:
- حساب على [Vercel](https://vercel.com/) (يفضل ربطه بحساب GitHub الخاص بك).
- حساب على [Clerk](https://clerk.com/) لإدارة المصادقة وتسجيل الدخول.
- حساب على [Stripe](https://stripe.com/) لإدارة الاشتراكات والدفع.
- قاعدة بيانات PostgreSQL (مثل [Neon](https://neon.tech/) أو [Supabase](https://supabase.com/)).
- مستودع الكود الخاص بك مرفوع على GitHub.

---

## 2. المتغيرات البيئية المطلوبة (Environment Variables)

أثناء إعداد المشروع على Vercel، ستحتاج إلى إضافة المتغيرات البيئية التالية. تأكد من تجهيزها مسبقاً:

### متغيرات المصادقة (Clerk)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...         # مفتاح النشر من لوحة تحكم Clerk
CLERK_SECRET_KEY=sk_test_...                   # المفتاح السري من لوحة تحكم Clerk
```

### متغيرات قاعدة البيانات (Database)
```env
DATABASE_URL=postgresql://user:password@host/db  # رابط الاتصال بقاعدة البيانات
```

### متغيرات الدفع والاشتراكات (Stripe)
```env
STRIPE_SECRET_KEY=sk_test_...                  # المفتاح السري من Stripe
STRIPE_WEBHOOK_SECRET=whsec_...                # مفتاح الـ Webhook السري من Stripe
STRIPE_PRO_MONTHLY_PRICE_ID=price_...          # معرف سعر الباقة الاحترافية (شهري)
STRIPE_PRO_YEARLY_PRICE_ID=price_...           # معرف سعر الباقة الاحترافية (سنوي)
STRIPE_ELITE_MONTHLY_PRICE_ID=price_...        # معرف سعر باقة النخبة (شهري)
STRIPE_ELITE_YEARLY_PRICE_ID=price_...         # معرف سعر باقة النخبة (سنوي)
```

### متغيرات النظام (System)
```env
APP_URL=https://tradexray.vercel.app           # رابط المنصة النهائي بعد النشر
NODE_ENV=production                            # بيئة التشغيل
```

---

## 3. خطوات النشر على Vercel

### الخطوة 1: استيراد المشروع
1. سجل الدخول إلى لوحة تحكم Vercel.
2. انقر على **"Add New..."** ثم اختر **"Project"**.
3. قم باستيراد مستودع `tradexray` من GitHub.

### الخطوة 2: إعدادات المشروع (Project Settings)
في صفحة "Configure Project"، تأكد من الإعدادات التالية:
- **Framework Preset**: سيقوم Vercel باكتشافه تلقائياً كـ `Vite` للواجهة الأمامية.
- **Root Directory**: إذا كان المشروع يعتمد على بنية Monorepo، تأكد من اختيار المسار الصحيح (مثل `artifacts/war-room` للواجهة الأمامية، و `artifacts/api-server` للواجهة الخلفية). *ملاحظة: إذا كان المشروع يستخدم Turborepo أو مساحات عمل (Workspaces)، فإن Vercel يدعم ذلك تلقائياً.*
- **Build Command**: `pnpm build` أو `npm run build`
- **Output Directory**: `dist`

### الخطوة 3: إضافة المتغيرات البيئية
قم بنسخ المتغيرات البيئية المذكورة في القسم (2) ولصقها في قسم **Environment Variables**.

### الخطوة 4: بدء النشر
انقر على زر **"Deploy"**. سيقوم Vercel بتثبيت الاعتمادات، بناء المشروع، ونشره.

---

## 4. إعداد الـ Backend كـ Serverless Functions (إذا لزم الأمر)

إذا كان الـ API Server (Express.js) مدمجاً ضمن نفس المستودع وتريد نشره على Vercel، يجب التأكد من وجود ملف `vercel.json` في الجذر (Root) لتوجيه الطلبات:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "artifacts/war-room/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    },
    {
      "src": "artifacts/api-server/src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "artifacts/api-server/src/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "artifacts/war-room/dist/$1"
    }
  ]
}
```
*ملاحظة: البنية أعلاه هي مثال، وقد تختلف قليلاً بناءً على هيكلة المستودع الدقيقة. Vercel يتعامل مع تطبيقات Express كدوال Serverless بكفاءة.*

---

## 5. إعدادات ما بعد النشر (Post-Deployment)

### إعداد Clerk (المصادقة)
1. اذهب إلى لوحة تحكم Clerk.
2. أضف رابط المنصة الجديد (مثال: `https://tradexray.vercel.app`) في قسم **Domains**.
3. قم بتفعيل طرق تسجيل الدخول المطلوبة (Google, Apple, Facebook, Twitter, Email, Phone) من قسم **User & Authentication -> Social Connections**.

### إعداد Stripe (الدفع)
1. اذهب إلى لوحة تحكم Stripe -> Developers -> Webhooks.
2. أضف نقطة نهاية (Endpoint) جديدة تشير إلى: `https://tradexray.vercel.app/api/webhooks/stripe`.
3. حدد الأحداث المطلوبة (مثل `checkout.session.completed`, `customer.subscription.updated`، إلخ).
4. انسخ الـ **Signing Secret** وقم بتحديث المتغير `STRIPE_WEBHOOK_SECRET` في Vercel.

---

## 6. أوامر مفيدة للتطوير المحلي (Local Development)

للتطوير واختبار النشر محلياً باستخدام Vercel CLI:

```bash
# تثبيت Vercel CLI
npm i -g vercel

# تسجيل الدخول
vercel login

# سحب المتغيرات البيئية من Vercel
vercel env pull .env.local

# تشغيل المشروع محلياً بيئة مطابقة لـ Vercel
vercel dev

# النشر لبيئة الاختبار (Preview)
vercel

# النشر لبيئة الإنتاج (Production)
vercel --prod
```

---

**تم إعداد المنصة بنجاح وهي جاهزة للانطلاق! 🚀**
