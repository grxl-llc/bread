# 🍞 Bread — Project Status

_Snapshot of where the app stands. Captured before consolidating front + back into one repo._

**Stack:** React + Vite (frontend) · FastAPI + SQLite (backend) · Kroger API (pricing) · AWS S3 (media)
**End goal:** one codebase → Web + iOS + Android (via Capacitor)

---

## ✅ DONE & WORKING (verified this session)

### Auth & Accounts
- [x] Email/password **signup** (fixed bcrypt backend crash — uses `bcrypt` directly)
- [x] **Login** + JWT tokens
- [x] **Zip code collected at signup** + "Use location" (keyless reverse-geocode)
- [x] **Post-signup onboarding** with zip fallback (for users who skipped it)
- [x] CORS fixed for `localhost` **and** `127.0.0.1`
- [x] `/api/auth/me` + profile update (`PATCH /me`)

### Location System
- [x] **Live-location toggle** in Settings (opt-in; prices follow you when traveling)
- [x] `useEffectiveZip` hook — saved zip OR live location, with fallback
- [x] Fixed Settings zip bug (`zip_code` → `zipcode` field mismatch)

### Social Feed
- [x] **Create post** (200 verified)
- [x] **Like** + like-count update
- [x] **Comment** (post + fetch)
- [ ] Notifications flow — _not fully tested (needs a 2nd account)_

### Pantry
- [x] **Add item** (fixed `item_name`→`name` + missing `brand`/`product_id` columns)
- [x] **Branded product autocomplete** (real Kroger search, thumbnails, "Any brand")
- [x] Quantity +/- , canonical **unit dropdown** (shared `lib/units.js`)
- [x] Barcode-scan add path field-mapping fixed

### Grocery
- [x] **Real product search** (replaced mock `SmartSearchBar`)
- [x] **Weekly Specials** preview = real Kroger sale items (`/api/pricing/deals`)
- [x] **Store selector ordered by distance** to zip (Kroger-family, "Closest" badge)
- [x] **Deals page** (`/Deals`) — broad sale list, personalized: favorites → pantry → savings
- [x] **Favorite items** (⭐, persists to `user.favorite_products`)
- [x] Grocery items: thumbnail + editable qty + canonical unit dropdown

### Recipes (the big one)
- [x] **Manual add** with branded ingredient autocomplete + unit dropdown
- [x] Save no longer hangs (nutrition/image/cost are best-effort, non-blocking)
- [x] **LIVE cost engine** — recomputed every view, reflects current sales:
  - [x] Cheapest-package-to-fulfill logic (cheap small jar, not lowest per-oz)
  - [x] Quantity scaling (2 lbs beef = 2× per-lb; 2 pcs = 2 packets; 2 tsp = 1 jar)
  - [x] Prices by **product ID** (re-prices the exact brand chosen)
  - [x] **Quantity-aware pantry deduction** (have 1 of 2 → buy 1; "have X, buy Y")
- [x] **Per-ingredient price breakdown** in detail view + "Have it" badges
- [x] **Brand swap** picker — searches generic keyword, all brands, live prices
- [x] **Saved search term** per ingredient (reused for brand swaps; self-heals on swap)
- [x] **Edit** recipe (title/time/servings) — inline form
- [x] **Photo upload / change** in edit (S3)
- [x] **Duplicate** recipe
- [x] Add recipe → grocery list

### Credentials in place (`backend/.env`)
- [x] **Kroger** client ID + secret (pricing works)
- [x] **AWS S3** keys + region (`us-east-2`) + bucket (`bread-user-media`)
- [x] JWT secret, DATABASE_URL

---

## ⚠️ NOT DONE / NEEDS WORK

### Missing credentials/services
- [ ] **Anthropic API key** — blocks: recipe import by text, recipe import by photo, AI nutrition, AI substitutions. (`BREAD_API_KEY` in .env is a custom app key, NOT Anthropic.)
- [ ] **AWS IVS** (live streaming) — not set up
- [ ] S3 upload — keys in, but do a real end-to-end upload test to confirm bucket/permissions

### Features not built / not tested
- [ ] **Preferred purchase sizing** (user pref) — engine has the hook, no UI yet
- [ ] **Package-size parsing** for exact weight/volume math (currently a heuristic)
- [ ] Notifications end-to-end (follow/like/comment from account B → A)
- [ ] Admin dashboard (hardcoded to `grxl.llc@gmail.com`) — untested
- [ ] Creator application / Creator dashboard / payouts — untested
- [ ] Brand application / Brand opportunities — untested
- [ ] Messages / Chat — untested
- [ ] Subscription / Bread+ — stub
- [ ] Google / Apple OAuth — stubs only
- [ ] Walmart / Target price scrapers — exist but fragile (unofficial endpoints)

### Consolidation & Deploy (end goal)
- [ ] **Merge into one repo** (frontend/ + backend/)
- [ ] Confirm `API_BASE_URL` is env-driven everywhere
- [ ] Deploy backend as API (RDS Postgres + ECS/host)
- [ ] Deploy frontend (static/PWA)
- [ ] **Add Capacitor** → iOS (Xcode) + Android (Android Studio) wrappers
- [ ] Move SQLite → Postgres for production

---

## 🔌 WHAT'S TRULY ROUTED

### Frontend pages (registered in `pages.config.js` + `App.jsx`)
**Auto-routed (with layout/bottom-nav):** Home, Recipes, Pantry, GroceryList, **Deals**, Tutorials, Notifications, Messages, UserProfile, Settings, AdminDashboard, AdvertiserPortal, CreatorDashboard, CollectionDetail, MonetizationInfo, Onboarding
**Explicit routes:** `/login`, `/signin`, `/signup`, `/post-signup-onboarding`, `/PublicProfile`, `/Chat`, `/TermsOfService`, `/PrivacyPolicy`, `/CreatorFAQ`, `/BrandOpportunities`, `/DataDeletionRequest`, `/CreatorApplication`, `/CreatorPayoutHistory`, `/BrandApplication`, `/AccountSettings`, `/NotificationPreferences`, `/SubscriptionManagement`

### Backend routers MOUNTED (`main.py`, prefix `/api`)
- `auth` — signup, signin, me, update, logout
- `entities` — generic CRUD for ALL models (Post, Comment, Like, Recipe, Pantry, etc.)
- `upload` — S3 file upload
- `llm` — Anthropic (needs key)
- `live` — IVS live streaming (needs setup)
- `pricing` — `/search`, `/compare`, `/stores`, `/deals`, `/recipe-cost`
- `kroger` — `/stores`, `/search`, `/recipe/cost`, `/recipe/compare`, `/auth-test`
- `basket` — `/search`

### Backend routers that EXIST but are NOT mounted (dead — entities router handles these)
`recipes.py`, `mealplans.py`, `pantry.py`, `ingredients.py`, `prices.py`, `models.py`, `household_members.py`, `user_prices.py`, `users.py`
→ _Cleanup candidates: delete or wire up. The app uses the generic `entities` router instead._

---

## 🗄️ DB columns added this session (SQLite `bread.db`, via ALTER TABLE)
- `users`: `creator_tier`, `use_live_location`, `favorite_products`, (signup now sets `zipcode`)
- `pantry_items`: `brand`, `product_id`
- `tutorials`: `creator_name`, `dish_name`, `is_replay`, `visibility`, `like_count`, `is_sponsored`
- `live_sessions`: `start_time`, `ad_breaks_triggered`
- New models: `ApprovedAd`, `BrandSponsorship`

> ⚠️ These were applied via direct ALTER TABLE on the dev SQLite DB. On a fresh DB, `create_all` builds them from the models. For production Postgres, use a proper migration (Alembic).

---

## ▶️ How to run locally
**Backend** (`bread-backend/`): `python3 -m uvicorn app.main:app --reload` → :8000
**Frontend** (`bread-front/`): `npm run dev` → :5173
Open **http://localhost:5173**
