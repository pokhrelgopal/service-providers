# Servio — Service-Provider Marketplace

A location-aware marketplace connecting **seekers** with verified local **service
providers**. Seekers discover nearby providers on a live map, send a service
request, chat in realtime once accepted, and leave a rating on completion.
Providers complete a verification application (documents + selfie) and are
approved by an admin before going live.

This repo holds **two independent projects** — no monorepo tooling. Each has its
own `package.json`, install, lint, build, and `.env`, and runs on its own port.

```
services-fullstack/
├── backend/    NestJS API            → http://localhost:5000
└── frontend/   Next.js (App Router)  → http://localhost:3000
```

## Tech stack

**Backend** — NestJS 11 · TypeScript (strict) · TypeORM + migrations · PostgreSQL
(`cube`+`earthdistance` for radius search) · Redis · MinIO (S3) · Google OAuth +
rotating JWTs · Socket.IO · Swagger.

**Frontend** — Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS v4 ·
TanStack Query · react-hook-form + zod · Zustand · axios · Leaflet · socket.io-client.
The design language is ported from the in-house `logistics-pitch` system.

## Prerequisites

- Node.js ≥ 20 (built on 25.x)
- npm ≥ 10
- Docker + Docker Compose (for Postgres/Redis/MinIO)

## Getting started

Start the infra once, then run each side independently.

### Infrastructure (Docker)

```bash
# from repo root — Postgres, Redis, MinIO (+console)
docker compose up -d
docker compose --profile tools up -d adminer   # optional DB UI on :8083
```

Host ports (non-default to avoid colliding with other local stacks):

| Service       | Host port | Notes                               |
| ------------- | --------- | ----------------------------------- |
| Postgres      | 5434      | db `marketplace`, postgres/postgres |
| Redis         | 6381      |                                     |
| MinIO API     | 9004      | minioadmin/minioadmin               |
| MinIO console | 9005      | http://localhost:9005               |
| Adminer       | 8083      | optional (`--profile tools`)        |

### Backend

```bash
cd backend
cp .env.example .env      # fill Google creds + secrets
npm install
npm run migration:run     # apply migrations (enables cube + earthdistance)
npm run start:dev         # http://localhost:5000  (API_PORT)
```

- Health: http://localhost:5000/health
- API docs (Swagger): http://localhost:5000/api/v1/docs

Migrations: `npm run migration:generate -- src/database/migrations/<Name>` ·
`npm run migration:run` · `npm run migration:revert`.

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev               # http://localhost:3000  (WEB_PORT)
```

Ports are env-configurable: `API_PORT` (backend) and `WEB_PORT` (frontend).

## Per-project scripts

| Script       | Backend                | Frontend               |
| ------------ | ---------------------- | ---------------------- |
| Dev server   | `npm run start:dev`    | `npm run dev`          |
| Build        | `npm run build`        | `npm run build`        |
| Lint         | `npm run lint`         | `npm run lint`         |
| Typecheck    | `npm run typecheck`    | `npm run typecheck`    |
| Format check | `npm run format:check` | `npm run format:check` |

## Environment

See [`backend/.env.example`](backend/.env.example) and
[`frontend/.env.example`](frontend/.env.example) for the full, documented set.
The frontend exposes only `NEXT_PUBLIC_*` values to the browser.

## Milestones

Built one milestone at a time (see `instructions.md`). Status:

- **M0 — Repo, tooling & design baseline** ✅
- **M1 — Backend foundation + dev infra** ✅ — docker-compose, env validation, global pipe/filter/envelope, helmet/CORS/throttler, pino + request IDs, TypeORM migrations, `/health`, Swagger
- **M2 — Auth & identity** ✅ _(current)_ — Google OAuth → JWT access + rotating refresh tokens (revocable in Redis, multi-device), logout/logout-all; role-set `User`; frontend login, axios silent-refresh interceptors, Zustand store, protected layout
- M3 — Onboarding & profile
- M4 — Provider application + document uploads
- M5 — Admin verification / moderation
- M6 — Location & nearby discovery (map)
- M7 — Service catalog & search
- M8 — Realtime: chat, live location, notifications (single socket)
- M9 — Service request lifecycle + reviews
- M10 — Hardening & production readiness
- M11 — Payments with Stripe _(deferred)_

### Milestone 0 — what's here

- Independent `backend/` (NestJS, strict TS) and `frontend/` (Next.js, strict TS)
  projects, each with ESLint + Prettier + Husky pre-commit hooks, on separate
  env-configurable ports.
- `logistics-pitch` design tokens and UI primitives (Button, Input, Label, Form,
  Card, Badge, Skeleton, Separator + Container/Eyebrow/SectionHeading/FadeIn)
  ported into `frontend/src/components`, demonstrated on the landing page.
- Feature-driven frontend folder skeleton (`features/*`, route groups, `lib`,
  `stores`).
- `.env.example` in each project; this README.
