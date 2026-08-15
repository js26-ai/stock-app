# نظام تسيير المخزون — React + Vite + Tailwind + Supabase

## التشغيل محليا
```bash
npm install
npm run dev
```

## Deploy على Vercel
1. ارفع هاد المشروع لـ GitHub (بالبنية كاملة كيفما هي)
2. https://vercel.com → New Project → استورد الريبو
3. Framework Preset: **Vite** (كيتعرف توماتيكمو)
4. Build Command: `npm run build` — Output Directory: `dist`
5. Deploy

## ملاحظة
- `src/supabaseClient.js` فارغ حاليا — حط فيه الاتصال ب Supabase (URL + anon key) ملي تكون واجد
- الجدول حاليا كيقرا/كيكتب من `localStorage` (بلا Supabase مربوط بعد)
