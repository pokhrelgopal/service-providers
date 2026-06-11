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

Built one milestone at a time (see `instructions.md`). Status — **M0–M10 complete**
(M11 Payments deferred):

- **M0–M2** ✅ Repo/tooling/design baseline · backend foundation + dev infra ·
  Google OAuth → JWT access + rotating refresh tokens (Redis, multi-device).
- **M3–M5** ✅ Onboarding (seeker 1-click; provider 5-step wizard) · provider
  application + MinIO document/selfie uploads · admin verification/moderation
  (password login, approve/reject, "account verified" email via BullMQ).
- **M6** ✅ Location & nearby discovery — `earthdistance` GiST radius search,
  Leaflet map. **Provider gives exact GPS; only the seeker pins.**
- **M7** ✅ **Service-request broadcasts** (replaces the catalog idea): a seeker
  broadcasts a need (service + description + radius); matching available
  providers within range see it live as a pulsing **raised-hand** marker and tap
  **"I can help"** → seeker sees responders in realtime. 30-min expiry.
- **M8** ✅ Realtime over a single JWT-authed Socket.IO gateway: **accept →
  engagement** (locks both sides), persistent **chat-head bubble** + minimal chat
  with an unread badge (per-participant `lastReadAt`).
- **M9** ✅ Request lifecycle (broadcast → offer → accept → in-progress →
  seeker-completes) + **ratings & reviews**; aggregate rating on provider cards.
- **M10** ✅ Hardening — multi-stage prod Dockerfiles (api + web standalone),
  `docker-compose.prod.yml` + env separation, `/metrics` (Prometheus), demo seed,
  unit tests, this runbook.
- **M11** — Payments with Stripe _(deferred until requested)_.

> **Model note:** the live product is **broadcast-first** (a seeker doesn't pick
> one provider to message — they broadcast and providers raise hands), and the
> provider UI is **map-first / mobile-first** (no dashboard sidebar). These
> intentionally diverge from the original brief's wording.

## Production

Multi-stage images build the API (`node dist/main`) and the web app (Next.js
**standalone**). A separate `migrate` service runs migrations as a one-off.

```bash
# from repo root
cp .env.prod.example .env.prod          # fill secrets, real domains, OAuth callback
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker compose -f docker-compose.prod.yml run --rm migrate   # apply migrations
```

- API → `:5000`, Web → `:3000` (front them with a TLS-terminating reverse proxy).
- `NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_SOCKET_URL` are **build-time** for the web
  image — pass them as build args in CI for a real domain. In dev they're unset
  and the client derives the API host from the page URL (LAN/mobile works).
- Google OAuth needs the prod callback whitelisted; it cannot use a private LAN IP.

## Runbook

| Task | Command |
| ---- | ------- |
| Apply migrations (dev) | `cd backend && npm run migration:run` |
| Apply migrations (prod image) | `npm run migration:run:prod` (`-d dist/...`) |
| Revert last migration | `npm run migration:revert` |
| Seed demo data (idempotent) | `cd backend && npm run seed:demo` |
| Run tests | `cd backend && npm test` |
| Health check | `GET /health` (unprefixed) |
| Prometheus metrics | `GET /metrics` (unprefixed, raw exposition text) |
| Self-hosted routing (OSRM) | `./docker/osrm/prepare.sh` once, then `docker compose --profile routing up -d osrm`; set `NEXT_PUBLIC_OSRM_URL=http://localhost:5001/route/v1` |
| API docs | `GET /api/v1/docs` (Swagger) |
| Structured logs | pino JSON on stdout (request IDs); pipe to your log sink |

**Seeded accounts.** Admin (password login): `admin@servio.com` / `Password@123`.
`npm run seed:demo` adds approved demo providers around Kathmandu (with skills +
ratings) and a demo seeker so the map has content.

**Common issues.**

- _Images don't load over LAN_ — MinIO presigned URLs point at the configured
  public endpoint; set `S3_PUBLIC_URL` to a host browsers can reach.
- _Sounds silent_ — react-sounds streams from a CDN (needs internet) and audio
  unlocks only after a first user gesture; both are expected.
- _CORS in prod_ — set `WEB_ORIGIN` to the exact web origin (dev reflects any
  origin; prod restricts to `WEB_ORIGIN`).
- `.env.example` in each project; this README.
