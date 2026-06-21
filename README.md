# 🍞 Bread

Cook smarter, spend less — recipes, pantry tracking, and live grocery pricing in one app.

One codebase → **Web + iOS + Android** (iOS/Android via Capacitor, added when ready for app stores).

## Repo layout
```
bread/
├── bread-front/     # React + Vite frontend (web + future Capacitor shells)
├── bread-backend/   # FastAPI + SQLite (→ Postgres in prod) backend
├── STATUS.md        # full feature status / what's done / what's left
└── .gitignore
```

## Run locally

**1. Backend** (`bread-backend/`)
```bash
cd bread-backend
cp .env.example .env        # then fill in keys (Kroger, AWS, JWT…)
pip3 install -r requirements.txt
python3 -m uvicorn app.main:app --reload   # → http://localhost:8000
```

**2. Frontend** (`bread-front/`)
```bash
cd bread-front
cp .env.example .env        # set VITE_API_BASE_URL (default http://localhost:8000)
npm install
npm run dev                 # → http://localhost:5173
```

Open **http://localhost:5173**.

## Environment
- **Never commit `.env`** — both are gitignored. Use `.env.example` as the template.
- Frontend talks to the backend via `VITE_API_BASE_URL` (env-driven), so the same
  build runs locally, on the web host, and inside the mobile app.

## Status
See [STATUS.md](./STATUS.md) for the full breakdown of what's working, what's
pending, and what's routed.
