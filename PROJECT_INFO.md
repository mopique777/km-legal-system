# KM Legal System - نظام إدارة المحاماة

## معلومات المشروع
- **الاسم**: KM Legal System
- **النوع**: تطبيق ويب متكامل لإدارة المكاتب القانونية
- **تاريخ الاستعادة**: 2026-02-07
- **الحالة**: جاهز للاستخدام

## البنية التقنية

### الخادم الخلفي (Backend)
- **الإطار**: FastAPI (Python)
- **قاعدة البيانات**: MongoDB
- **المنفذ**: 8000
- **الميزات**:
  - Google Generative AI Integration
  - Google Drive Integration
  - JWT Authentication
  - CORS Support
  - File Upload Management

### الفرونتند (Frontend)
- **الإطار**: React 19
- **المنفذ**: 3000
- **التصميم**: Tailwind CSS + Radix UI
- **الميزات**:
  - RTL Support (من اليمين لليسار)
  - Dark Mode
  - Responsive Design
  - Modern UI Components

## الميزات الرئيسية

1. **لوحة التحكم** - عرض الإحصائيات والتقارير
2. **إدارة العملاء** - إضافة وتعديل بيانات العملاء
3. **إدارة القضايا** - متابعة جميع القضايا والمواعيد
4. **المستندات** - رفع وإدارة الملفات القانونية
5. **الفواتير** - إنشاء وتتبع المدفوعات
6. **المساعد الذكي** - تحليل العقود وتلخيص القضايا
7. **الإشعارات** - تنبيهات فورية للمواعيد المهمة

## كيفية التشغيل

### تشغيل الخادم الخلفي
```bash
cd /home/ubuntu/km-legal-system/backend
python3 server.py
```

### تشغيل الفرونتند
```bash
cd /home/ubuntu/km-legal-system/frontend
npm start --legacy-peer-deps
```

### الوصول إلى التطبيق
- **الفرونتند**: http://localhost:3000
- **الخادم الخلفي**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## المتطلبات البيئية

### Backend
- Python 3.8+
- MongoDB
- Google API Credentials
- Environment Variables (.env):
  - MONGO_URL
  - DB_NAME
  - GOOGLE_DRIVE_CREDENTIALS
  - GOOGLE_GENERATIVE_AI_KEY

### Frontend
- Node.js 14+
- npm or yarn
- Modern Browser with RTL Support

## الملاحظات المهمة

- تم حذف حزمة `emergentintegrations` غير المتوفرة من المتطلبات
- تم استخدام `--legacy-peer-deps` لحل تضارب الاعتماديات في npm
- النظام يعمل بشكل كامل مع دعم RTL
- الوضع الليلي مفعل وجميل

## آخر تحديث
- **التاريخ**: 2026-02-07
- **الحالة**: مستقر وجاهز للإنتاج
