# 🌹 MSZ Welcome Bot

بوت Discord للترحيب بالأعضاء الجدد مع صورة مخصصة تحتوي على:
- **دائرة** فيها صورة البروفايل
- **مستطيل سهم** فيه اسم العضو
- خلفية صورة MSZ الأصلية

---

## 📋 المتطلبات

- [Node.js](https://nodejs.org) الإصدار 18 أو أحدث
- حساب على [Discord Developer Portal](https://discord.com/developers/applications)

---

## 🚀 طريقة التشغيل

### الخطوة 1 — إنشاء البوت في Discord Developer Portal

1. اذهب إلى https://discord.com/developers/applications
2. اضغط **New Application** → أعطه اسماً
3. من القائمة الجانبية اختر **Bot** → اضغط **Add Bot**
4. افتح قسم **Privileged Gateway Intents** وفعّل:
   - ✅ `SERVER MEMBERS INTENT`
5. انسخ التوكن من زر **Reset Token** → هذا هو `DISCORD_TOKEN`
6. من القائمة اختر **OAuth2 → General** وانسخ **Application ID** → هذا هو `CLIENT_ID`

### الخطوة 2 — دعوة البوت للسيرفر

في **OAuth2 → URL Generator**:
- Scopes: `bot` + `applications.commands`
- Bot Permissions:
  - ✅ Send Messages
  - ✅ Embed Links
  - ✅ Attach Files
  - ✅ View Channels

انسخ الرابط وافتحه لتضيف البوت لسيرفرك.

### الخطوة 3 — إعداد المشروع

```bash
# 1. انسخ ملف الإعدادات
cp .env.example .env

# 2. عدّل الملف وضع التوكن و CLIENT_ID
nano .env   # أو افتحه بأي محرر نصوص

# 3. ثبّت المكتبات
npm install

# 4. شغّل البوت
node index.js
```

---

## ⚙️ أوامر السيت-آب (Slash Commands)

بعد تشغيل البوت ستظهر هذه الأوامر في السيرفر:

| الأمر | الوصف | الصلاحية المطلوبة |
|-------|-------|-------------------|
| `/setup-welcome #channel` | حدد قناة الترحيب | Manage Server |
| `/test-welcome` | اختبر صورة الترحيب على نفسك | Manage Server |
| `/welcome-status` | اعرض القناة المحددة حالياً | الكل |

### مثال على الإعداد:
```
/setup-welcome channel:#👋-welcome
```

---

## 📁 هيكل المشروع

```
welcome-bot/
├── index.js          ← الكود الرئيسي
├── background.png    ← صورة خلفية MSZ
├── .env              ← التوكن والـ ID (لا ترفعه على GitHub!)
├── .env.example      ← نموذج الإعدادات
├── package.json
└── README.md
```

---

## 💡 ملاحظات

- **الأوامر تنتشر عالمياً** — قد تحتاج حتى ساعة لتظهر في السيرفر
- **قناة الترحيب** تُحفظ في الذاكرة فقط، كل إعادة تشغيل تحتاج إعداد `/setup-welcome` من جديد — لاستمرارية حقيقية استخدم قاعدة بيانات (SQLite مثلاً)
- **لا تشارك `.env`** مع أحد أو ترفعه على GitHub
