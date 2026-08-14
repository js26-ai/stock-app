# تسيير المخزون — React + Tailwind + Supabase

تطبيق تسيير مخزون بصفحة واحدة (`src/App.jsx`): تسجيل منتجات، بيع، إحصائيات، واجهة RTL عربية.
الداتا كتتخزن ف Supabase (بلا localStorage للمنتجات/المبيعات).

## 1. تجهيز Supabase
1. أنشئ مشروع على https://supabase.com
2. نفذ محتوى `supabase/schema.sql` كامل ف SQL Editor
3. خد **Project URL** و **anon public key** من *Settings > API*

## 2. التشغيل محليا (Windows / Node v24)

```powershell
npm install
npm run dev
```

يفتح على http://localhost:5173. سير لـ تبويب **الإعدادات** وعمر SUPABASE_URL و SUPABASE_ANON_KEY، ضغط **حفظ**.

## Deploy على Vercel

1. حط الكود ف repo على GitHub
2. https://vercel.com → New Project → استورد الـ repo (Vite كيتعرف توماتيكمو)
3. Deploy
4. بعد الفتح، دخل لـ **الإعدادات** ف التطبيق وعمر معلومات Supabase (كتبقى محفوظة ف المتصفح ديالك)

## بنية المشروع
```
src/
  App.jsx            ← التطبيق كامل (Dashboard, Products, Sales, Settings)
  supabaseClient.js  ← إنشاء client ديناميكي حسب الإعدادات المحفوظة
  main.jsx
  index.css
supabase/
  schema.sql          ← جداول products و sales
```

