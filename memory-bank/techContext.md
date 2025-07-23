# הקשר טכני ותצורת הפיתוח

## Stack טכנולוגי

### Frontend
- **React 18** - ספריית UI מרכזית
- **Tailwind CSS** - עיצוב וסטיילינג
- **Shadcn/UI** - רכיבי UI מוכנים ונגישים
- **React Hook Form** - ניהול טפסים ווולידציה
- **React Router** - ניווט בין דפים
- **Recharts** - גרפים ותרשימים לדשבורד

### Backend & Database
- **Supabase** - מסד נתונים, אימות ו-API
  - PostgreSQL database
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Built-in auth system

### Email & Automation
- **Supabase Edge Functions** - פונקציות serverless
- **Nodemailer** או שירות דואר מוכן (לבחירה)
- **Cron Jobs** - דוחות יומיים אוטומטיים

### Development Tools
- **Vite** - build tool מהיר
- **TypeScript** - type safety
- **ESLint + Prettier** - code quality
- **Git** - version control

## מבנה הפרויקט
```
fish_order/
├── src/
│   ├── components/     # רכיבי UI נפוצים
│   ├── pages/         # דפי האפליקציה
│   ├── hooks/         # Custom hooks
│   ├── types/         # TypeScript types
│   ├── lib/           # Utilities וחיבור Supabase
│   └── styles/        # קבצי CSS נוספים
├── supabase/          # מיגרציות ופונקציות
├── public/            # קבצים סטטיים
└── docs/              # תיעוד פרויקט
```

## דרישות מערכת
- Node.js 18+
- npm או yarn
- דפדפן מודרני עם תמיכה ב-ES6+
- חשבון Supabase (free tier מספיק)

## Environment Variables נדרשים
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
EMAIL_SERVICE_CONFIG=your_email_config
```

## חיבורי חוץ
- **Supabase** - מסד נתונים ו-backend
- **שירות Email** - שליחת הודעות
- **אחסון תמונות** - Supabase Storage או Cloudinary

## דרישות ביצועים
- זמן טעינה ראשונית < 3 שניות
- תגובתיות למובייל בכל המסכים
- עבודה offline באופן חלקי (cache)
- תמיכה בדפדפנים ישנים ב-95%

## אבטחה ופרטיות
- HTTPS בחובה בפרודקשן
- הגנה מפני SQL injection (מובנה ב-Supabase)
- Rate limiting על API calls
- גיבוי אוטומטי של מסד הנתונים 