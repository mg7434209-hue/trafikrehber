# TrafikRehber

Trafik cezaları, sigorta, ehliyet ve araç işlemleri SEO platformu.

## Proje Yapısı

```
trafikrehber/
├── backend/          → FastAPI + PostgreSQL
└── frontend/         → React.js
```

## Railway Deploy

### 1. Backend Servisi
- Root Directory: `/backend`
- Environment Variables:
  ```
  DATABASE_URL=<Railway PostgreSQL URL>
  JWT_SECRET=<güçlü random string>
  JWT_ALGORITHM=HS256
  JWT_EXPIRE_HOURS=24
  GEMINI_API_KEY=<Google AI Studio key>
  CORS_ORIGINS=https://trafikrehber.com,https://www.trafikrehber.com,https://<frontend>.up.railway.app
  SITE_URL=https://trafikrehber.com
  ADMIN_EMAIL=admin@trafikrehber.com
  ADMIN_PASSWORD=<güçlü şifre>
  ```

### 2. Frontend Servisi
- Root Directory: `/frontend`
- Environment Variables:
  ```
  REACT_APP_BACKEND_URL=https://<backend>.up.railway.app
  REACT_APP_SITE_URL=https://trafikrehber.com
  ```

### 3. Seed Data Yükle
Backend deploy olduktan sonra:
```bash
# Railway CLI veya backend terminal üzerinden
python seed.py
```

## Domain
trafikrehber.com → Frontend Railway servisine CNAME
