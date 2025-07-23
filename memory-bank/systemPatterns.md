# דפוסי מערכת וארכיטקטורה

## ארכיטקטורה כללית
```
Frontend (React) ↔ Supabase ↔ Email Service
                     ↓
                Database Tables
```

## מבנה מסד הנתונים

### טבלאות עיקריות:
1. **fish_types** - סוגי דגים ומאפיינים
2. **cut_types** - סוגי חיתוך ותוספות מחיר
3. **fish_cut_prices** - מחירים מותאמים לדג ספציפי
4. **orders** - הזמנות לקוחות

### יחסים:
- fish_types ← fish_cut_prices → cut_types (Many-to-Many)
- orders מכיל JSON של פריטי הזמנה

## דפוסי תכנות מרכזיים

### Frontend Patterns:
- **Context API** לניהול מצב גלובלי (סל קניות, משתמש מחובר)
- **Custom Hooks** לפעולות Supabase נפוצות
- **Component Composition** לרכיבים הניתנים לשימוש חוזר
- **Form Validation** עם React Hook Form

### Data Flow Patterns:
- **Optimistic Updates** עבור פעולות CRUD
- **Real-time subscriptions** לעדכוני מלאי
- **Caching Strategy** לנתונים שמשתנים לעיתים רחוקות

### Security Patterns:
- **Row Level Security (RLS)** ב-Supabase
- **Admin Routes Protection** עם middleware
- **Input Sanitization** בכל הטפסים

## רכיבי ממשק נפוצים
- FishCard (תצוגת דג בקטלוג)
- OrderSummary (סיכום הזמנה)
- AdminTable (טבלאות ניהול)
- PriceDisplay (תצוגת מחירים דינמית)
- DateTimePicker (בחירת תאריך ושעה)

## אימות ואבטחה
- אימות אדמין באמצעות Supabase Auth
- הגבלת גישה לנתוני אדמין ברמת DB
- וולידציה של קלט בצד קליינט ושרת

## ביצועים ואופטימיזציה
- Lazy loading של תמונות דגים
- Pagination בממשק אדמין
- Database indexes על שדות מרכזיים
- Image optimization (WebP format) 