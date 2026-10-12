# Skin Care Management System (SCMS)

A full-stack relational DBMS web application that lets users track skin-care routines, products, progress and appointments, and gives administrators tools to manage the catalog and the user base.

> **Medical disclaimer**: SCMS is a self-tracking application. It does **not** diagnose skin conditions, prescribe medication, or replace a dermatologist. Please consult a qualified professional for any persistent or serious concerns.

---

## 1. Project Overview

SCMS is built around a relational PostgreSQL database. The frontend is a React/TypeScript SPA; the backend is a Node.js/Express/TypeScript REST API. Authentication uses JWT and bcrypt. The application is designed to be deployed for free on Vercel (frontend), Render (backend), and Supabase (PostgreSQL).

---

## 2. Features

### User
- Register, log in, log out.
- Maintain a skin profile (skin type + notes).
- Track skin concerns with severity (1–5).
- Browse and search the product catalog.
- Maintain a personal "Cabinet" of products they own/use.
- Create and edit routines (Morning / Night / Weekly / Custom) with ordered product steps.
- Record progress over time and see a trend chart.
- Request appointments and view appointment history.

### Admin
- View dashboard with aggregate statistics.
- Activate / deactivate users.
- Create / update / deactivate categories and products.
- Manage appointment statuses.
- View audit logs.

---

## 3. Architecture

```
┌────────────────┐    HTTPS/JSON    ┌──────────────────────┐
│ React frontend │ ───────────────▶ │  Express REST API    │
│ (Vite)         │                  │  (Node.js + TS)      │
└────────────────┘                  └──────────┬───────────┘
                                                │  SQL (pg)
                                                ▼
                                    ┌──────────────────────┐
                                    │ PostgreSQL           │
                                    │ (Supabase in prod)   │
                                    └──────────────────────┘
```

Deployment target:

```
GitHub
 ├─▶ Vercel   (frontend)
 └─▶ Render   (backend) ─▶ Supabase (PostgreSQL)
```

---

## 4. Technology Stack

| Layer        | Technology                                |
|--------------|--------------------------------------------|
| Frontend     | React 18, TypeScript, Vite, React Router   |
| Styling      | Plain CSS (custom design tokens)           |
| Backend      | Node.js, Express 4, TypeScript             |
| Database     | **SQLite** (MVP, default) or **PostgreSQL 14+** (production / Supabase) |
| DB drivers   | `pg` and `better-sqlite3` (raw parameterized SQL, no ORM) |
| Auth         | JWT (`jsonwebtoken`) + bcrypt              |
| Validation   | `zod`                                      |
| Security     | helmet, CORS, rate limiting on auth        |
| Tests        | Jest + Supertest (backend), Vitest + RTL (frontend) |

> The backend uses a thin driver-abstraction layer so the same SQL repositories work on both SQLite and PostgreSQL. SQLite is the default for local MVP demos (zero setup); switch to PostgreSQL in production by changing `DATABASE_URL`.

---

## 5. Project Structure

```
skin-care-management-system/
├── frontend/
│   └── src/                  React app
│       ├── components/       UI components (cards, chart, layout)
│       ├── context/          Auth & Toast contexts
│       ├── hooks/            useApi data hook
│       ├── layouts/          MainLayout
│       ├── pages/            Route pages
│       ├── services/         API client + endpoint wrappers
│       ├── types/            TS types
│       └── test-setup.ts     Vitest setup
│
├── backend/
│   └── src/
│       ├── config/           Env config
│       ├── controllers/      HTTP handlers
│       ├── db/               pool + migration/seed scripts
│       ├── middleware/       auth + error handler
│       ├── repositories/     SQL queries
│       ├── routes/           Express router
│       ├── services/         (reserved)
│       ├── types/            TS types
│       ├── utils/            responses, audit, asyncHandler
│       ├── app.ts            Express app
│       └── server.ts         Entry point
│
├── database/
│   ├── migrations/           Numbered SQL migrations
│   └── seed/                 seed.sql (reference data)
│
├── docs/
│   ├── ER_DIAGRAM.md
│   ├── API.md
│   └── DBMS.md
│
├── README.md
├── .gitignore
└── LICENSE
```

---

## 6. Database Schema

See [`docs/ER_DIAGRAM.md`](docs/ER_DIAGRAM.md) and [`docs/DBMS.md`](docs/DBMS.md).

Tables:

| Table                | Purpose                                       |
|----------------------|-----------------------------------------------|
| `users`              | Authentication + identity                     |
| `skin_profiles`      | 1:1 user skin profile                         |
| `skin_concerns`      | Master list of concerns                       |
| `user_skin_concerns` | M:N user ↔ concern with severity              |
| `product_categories` | Catalog categories                            |
| `products`           | Catalog products                              |
| `user_products`      | Personal "Cabinet" (user ↔ product)           |
| `routines`           | User-created routines                         |
| `routine_products`   | Junction routine ↔ product with `step_order`  |
| `progress_records`   | Self-reported progress over time              |
| `appointments`       | User appointments with status                 |
| `audit_logs`         | Action audit trail                            |

Views:

- `v_product_catalog` — products joined with category name.
- `v_user_dashboard` — per-user aggregates for the dashboard.
- `v_admin_user_stats` — per-user aggregated counts.

Trigger:

- `set_updated_at()` updates `updated_at` on every row modification for users, profiles, products, routines, and appointments.

---

## 7. Local Setup

You need Node.js 18+ and either:

- **Option A (MVP / demo, recommended for local):** the bundled **SQLite** driver — zero external services, perfect for showing the project on localhost. See [section 7.1](#71-mvp-quickstart-sqlite-recommended-for-local-demo).
- **Option B (production):** a **PostgreSQL** instance (local or Supabase). See [section 7.2](#72-production-setup-postgresql--supabase).

Both backends share the same REST API and frontend, so you can migrate at any time by changing `DATABASE_URL`.

### 7.1 MVP quickstart (SQLite, recommended for local demo)

This path uses a local file-based SQLite database (`backend/data/scms.sqlite`) so you can demo the project with **no PostgreSQL install, no Supabase account, and no env setup beyond the defaults**.

```bash
# 1. Clone and enter the repo
git clone https://github.com/<your-username>/skin-care-management-system.git
cd skin-care-management-system

# 2. Backend: install, migrate, seed, run
cd backend
npm install
npm run migrate            # creates backend/data/scms.sqlite with all tables
npm run seed               # inserts reference data + demo users
npm run dev                # http://localhost:5000
```

Open a second terminal:

```bash
# 3. Frontend
cd ../frontend
npm install
npm run dev                # http://localhost:5173
```

> SQLite is enabled automatically when `DATABASE_URL` is empty or starts with `sqlite:`. The committed `backend/.env` already points at SQLite so you can skip the env setup entirely.
>
> To use Postgres later, just change `DATABASE_URL` in `backend/.env` to your PostgreSQL connection string and re-run `npm run migrate && npm run seed`. The code paths are identical.

Health check: `GET http://localhost:5000/api/health` → `{ "success": true, "data": { "status": "ok" } }`

### 7.2 Production setup (PostgreSQL / Supabase)

Use this when you're ready to deploy or share across machines.

```bash
# 1. Clone and enter the repo
git clone https://github.com/<your-username>/skin-care-management-system.git
cd skin-care-management-system
```

#### Database (Supabase or local)

**Supabase**
1. Create a project at <https://supabase.com>.
2. In *Project Settings → Database*, copy the **Connection string** (Transaction mode).
3. Set it as `DATABASE_URL` in `backend/.env`.

**Local PostgreSQL**
```bash
createdb scms
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/scms
```

#### Backend

```bash
cd backend
cp .env.example .env       # then set DATABASE_URL, JWT_SECRET, etc.
npm install
npm run migrate            # applies database/migrations/*.sql
npm run seed               # inserts admin + demo data
npm run dev                # http://localhost:5000
```

#### Frontend

```bash
cd ../frontend
cp .env.example .env       # VITE_API_BASE_URL=http://localhost:5000/api
npm install
npm run dev                # http://localhost:5173
```

### 7.3 Demo credentials (after seeding)

- Admin: `admin@scms.local` / `Admin@12345`
- Demo users (passwords all `User@12345`): `alex@example.com`, `jordan@example.com`, `sam@example.com`

> Change these in production. The seed values are configurable via `backend/.env` (`SEED_ADMIN_*`).

---

## 8. Environment Variables

### Backend (`backend/.env`)

```
PORT=5000
DATABASE_URL=your_supabase_postgresql_connection_string
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

SEED_ADMIN_EMAIL=admin@scms.local
SEED_ADMIN_PASSWORD=Admin@12345
SEED_ADMIN_NAME=System Admin
SEED_USER_PASSWORD=User@12345
```

### Frontend (`frontend/.env`)

```
VITE_API_BASE_URL=http://localhost:5000/api
```

`.env` files are in `.gitignore`. Never commit them.

---

## 9. Database Migrations & Seeding

```bash
cd backend
npm run migrate    # runs every file in database/migrations in order
npm run seed       # idempotent; re-runs are safe
```

Both scripts connect to `DATABASE_URL` and print progress.

---

## 10. Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

Backend tests cover the auth middleware (token verification, role enforcement, expiration) and Zod validation. They run without a live database.

> Integration tests that require a real PostgreSQL instance can be added by exporting `DATABASE_URL` to a test database and using Supertest against `buildApp()`.

---

## 11. Deployment

### Frontend → Vercel

1. Push the repo to GitHub.
2. On Vercel, import the repo and choose the `frontend/` directory.
3. Set `VITE_API_BASE_URL` to your Render backend URL (e.g. `https://scms-api.onrender.com/api`).
4. Deploy.

### Backend → Render

1. Create a new **Web Service** pointing at the repo, root `backend/`.
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Environment variables: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`.
5. Render's free tier spins down after 15 minutes of inactivity — the first request after inactivity will be slow.

### Database → Supabase

1. Create a Supabase project.
2. Copy the connection string into `DATABASE_URL` on Render.
3. Run `npm run migrate && npm run seed` against that database once (e.g. via a one-off shell or by running the scripts locally with the production URL).
4. The free tier has a 500 MB storage cap and may pause after inactivity.

> **Verify current free-tier limits before deploying** — provider policies change.

---

## 12. Free-Tier Limitations

| Service        | Limitation                                                        |
|----------------|-------------------------------------------------------------------|
| Vercel Hobby   | $0 for personal/non-commercial use; verify current terms          |
| Render Free    | Web services spin down after ~15 min inactivity                   |
| Supabase Free  | 500 MB DB; projects may pause after inactivity                   |

---

## 13. Security

- **Passwords** are hashed with `bcrypt` (cost 10). Plaintext is never stored or returned.
- **JWT** is signed with `JWT_SECRET`; the token is sent via the `Authorization: Bearer` header.
- **CORS** restricts the frontend origin via `FRONTEND_URL`.
- **Helmet** adds standard secure headers.
- **Rate limiting** is applied to `/api/auth/register` and `/api/auth/login`.
- **Parameterized SQL** — every query uses `$1, $2, …` placeholders. No string interpolation of user input.
- **Role-based authorization** is enforced server-side on every protected route.
- **Secrets** live in `.env`, which is `.gitignore`d. `.env.example` is provided.
- **Production errors** are not echoed to clients (only safe messages).

---

## 14. API Documentation

See [`docs/API.md`](docs/API.md) for the full endpoint reference.

Base URL: `/api`

Highlights:

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST /api/profile`
- `GET /api/skin-concerns`, `GET/PUT /api/profile/concerns`
- `GET /api/products`, `GET /api/products/:id` (public)
- `POST/PUT/PATCH/DELETE /api/products/...` (admin)
- `GET/POST/PUT/DELETE /api/my-products`
- `GET/POST/PUT/DELETE /api/routines`
- `POST/PUT/DELETE /api/routines/:id/products/...`
- `GET/POST/PUT/DELETE /api/progress`
- `GET/POST/PUT /api/appointments`, `PATCH /api/appointments/:id/status` (admin)
- `GET /api/admin/stats`, `/api/admin/users`, `/api/admin/audit-logs` (admin)

---

## 15. DBMS Concepts Demonstrated

See [`docs/DBMS.md`](docs/DBMS.md).

- **Normalization** to 3NF — categories and concerns are referenced by ID, not duplicated.
- **Primary keys** (`BIGSERIAL`) on every table.
- **Foreign keys** with explicit `ON DELETE` policies (`CASCADE`, `RESTRICT`, `SET NULL`).
- **Unique constraints** — `users.email`, `skin_concerns.name`, `product_categories.name`, `user_skin_concerns(user_id, concern_id)`, `routine_products(routine_id, step_order)`.
- **CHECK constraints** — rating/severity 1–5, role, routine type, appointment status, etc.
- **NOT NULL** for required fields.
- **Indexes** on every foreign key plus search columns.
- **Views** for catalog and dashboard aggregation.
- **Triggers** to maintain `updated_at`.
- **Transactions** for multi-step writes (e.g. routines + routine_products).
- **JOINs** (INNER, LEFT) in catalog listings and admin stats.
- **GROUP BY / COUNT / ORDER BY / LIMIT / OFFSET** for pagination and aggregation.

---

## 16. ER Diagram

See [`docs/ER_DIAGRAM.md`](docs/ER_DIAGRAM.md).

---

## 17. Future Improvements

- Email notifications (SMTP from a free provider).
- Image uploads (Supabase Storage free tier).
- Full-text product search.
- Routine adherence logs.
- Multi-language support.
- Mobile PWA.

---

## 18. License

MIT. See `LICENSE`.
