# Build Prompt — Service Provider Marketplace (NestJS + Next.js)

> Paste this whole file into Claude Code as the project brief. It is **milestone-based**: build and stop at the end of each milestone for review before moving on. Do not jump ahead.

---

## 0. Read this first (how to work)

- Build **one milestone at a time**. At the end of each, stop, summarize what was done, list how to run/verify it, and wait for my approval before starting the next.
- Prefer **small, clean, production-grade code over boilerplate**. Only build what the milestone needs.
- **Comments:** sparse, one-liner, only where intent isn't obvious. No comment walls.
- Follow the **global conventions** (Section 3) in every milestone — don't restate them, just apply them.
- For all **frontend visual design** (navbars, cards, forms, spacing, typography, color), match the look and feel of the existing project named **`logistics-pitch`** in this same directory. Read its components first and reuse its design language; do not invent a new style system.
- If a requirement is ambiguous, make the **most standard production choice**, note the assumption in your milestone summary, and keep going.

---

## 1. What we're building

A location-aware **service-provider marketplace**. Two kinds of users:

- **Seekers** — looking for service providers near them.
- **Providers** — offer a service; must complete an extra verification profile (form + document images + a photo of themselves) and get approved by an admin before going live.

After login, users hit a clean onboarding screen and choose their path. Seekers can discover nearby providers on a **live map**, filter them, and start a request. The app uses realtime for notifications, chat, and live location.

A user may be **both** a seeker and a provider over time — model roles as a set, not a single enum.

### Core interaction loop (assumption — confirm or change)

1. Seeker finds a provider on the map / in search.
2. Seeker sends a **service request**.
3. Provider **accepts / declines**.
4. On accept → a **chat** opens and (optionally) a **live-location** session for the active engagement.
5. On completion → seeker can leave a **rating + review**.

---

## 2. Tech stack (pin these)

**Backend (NestJS)**

- NestJS (latest), TypeScript strict mode.
- TypeORM with **migrations** (never `synchronize: true` outside the very first scaffold; turn it off before Milestone 1 ends).
- **PostgreSQL (standard `postgres` image)** with the `cube` + `earthdistance` extensions enabled — used for "providers around me" radius search (no PostGIS needed).
- Redis (cache, sessions/refresh-token store, Socket.IO Redis adapter for multi-instance broadcast).
- MinIO (S3-compatible) for document and profile images, via **presigned URLs**.
- Auth: **Google OAuth** + JWT (short-lived access + rotating refresh tokens).
- Realtime: a **single app-wide Socket.IO connection** handles everything — chat, live location, and notifications (pushed as a `notification:new` event). No SSE. Use `@nestjs/platform-socket.io` + `@socket.io/redis-adapter`. Notifications are also persisted in the DB and served via REST (list + unread count); the socket only delivers the live push.
- `@nestjs/swagger` for OpenAPI, `@nestjs/terminus` for `/health`, `@nestjs/throttler` for rate limiting, `helmet`, CORS, global validation pipe, global exception filter.
- Config via `@nestjs/config` with **schema-validated env** (zod or joi) — app refuses to boot on bad env.
- Structured logging (pino) with request IDs.

**Frontend (Next.js)**

- Next.js **App Router**, TypeScript strict.
- **Feature-driven architecture** (Section 4).
- Data: **TanStack Query**. Forms: **react-hook-form + zod**. Global/client state: **Zustand**. Realtime: a single app-wide **socket.io-client** connection (wrapped in a custom hook / provider) for chat, live location, and notifications. HTTP: **axios with interceptors** (attach token, refresh-on-401, normalize errors).
- Maps: **Leaflet** (react-leaflet) with OpenStreetMap tiles (handle attribution + a configurable tile URL/key).
- Protected routes via App Router layouts; clean help text on every form.

**Repo layout (no monorepo / no workspace tooling)**

- A single top-level folder **`services-fullstack/`** containing two independent projects:
  - `services-fullstack/backend/` — the NestJS API.
  - `services-fullstack/frontend/` — the Next.js app.
- Each has its **own** `package.json`, install, lint, build, and `.env`, and **runs on its own port** (e.g. backend `:4000`, frontend `:3000` — make ports env-configurable).
- No shared package. Each side owns its own validation: backend validates via DTOs, frontend has its own zod schemas. Some shape duplication is acceptable and expected here — do not introduce workspace tooling to avoid it.

**Local dev**

- Single `docker-compose.yml` bringing up Postgres (standard image, with `cube`+`earthdistance` enabled via init), Redis, MinIO (+ console), and optionally Adminer. `.env.example` checked in. One-command spin-up documented in the README.

---

## 3. Global conventions (apply everywhere)

- **API:** versioned (`/api/v1`), consistent success/error response envelope, cursor or page/limit pagination with a documented standard, ISO timestamps, soft-deletes where it matters.
- **Errors:** global exception filter → predictable JSON shape; never leak stack traces in prod.
- **Validation:** all input validated (zod in shared package on FE, DTO validation on BE).
- **Security:** helmet, strict CORS allowlist, throttling on auth + write routes, no secrets in client bundles, file-upload type/size validation, presigned URLs only (clients never get bucket creds).
- **AuthN/Z:** RBAC guard driven by the user's role set; provider-only and admin-only routes protected.
- **DB:** every schema change is a migration; seed script for demo data.
- **Frontend:** loading / empty / error states for every async surface; accessible and responsive; no `any` leaking through.
- **Docs:** Swagger stays current; root README explains setup, env, and how to run each milestone.

---

## 4. Frontend feature-driven structure (target shape)

```
services-fullstack/frontend/src/
  app/                      # App Router: route groups + layouts
    (public)/               # landing, login
    (onboarding)/           # role selection, provider application
    (app)/                  # authenticated area (protected layout)
  features/
    auth/                   # api, hooks, store, components, schemas
    onboarding/
    providers/              # discovery, map, listing, detail
    requests/               # service request lifecycle
    chat/
    location/
    profile/
    notifications/
  components/ui/            # shared primitives (match logistics-pitch)
  lib/                      # axios instance + interceptors, query client, socket helper, env
  stores/                   # cross-feature zustand stores
```

Each feature owns its `api`, `hooks`, `components`, `schemas`, and `store`. No cross-feature imports except through a feature's public index. Keep it lean — create folders only when a feature actually needs them.

---

## 5. Milestones (build & stop after each)

### Milestone 0 — Repo, tooling, and design baseline

- Create `services-fullstack/` with independent `backend/` (NestJS) and `frontend/` (Next.js) projects, each with its own `package.json`, strict TS config, ESLint + Prettier, and commit hooks. They run on separate, env-configurable ports.
- Read `logistics-pitch` and port its design tokens/primitives into the frontend's `components/ui` so later screens inherit the look.
- `.env.example` in each project, root README skeleton covering how to run both.
- **Review:** both projects install and lint/build pass independently; each starts on its own port; design primitives render in a sample page.

### Milestone 1 — Backend foundation + dev infra

- `docker-compose.yml`: Postgres (standard image; init script enables `cube` + `earthdistance`), Redis, MinIO(+console), Adminer optional.
- NestJS app boots with: env-schema validation, global validation pipe, global exception filter, response envelope interceptor, helmet, CORS, throttler, pino logging with request IDs.
- TypeORM wired with **migrations** (disable `synchronize`). `/health` (Terminus: db, redis, minio) and `/api/v1/docs` (Swagger) live.
- **Review:** `docker compose up` + API starts, `/health` green, Swagger loads, one example migration runs.

### Milestone 2 — Auth & identity

- Google OAuth login → issue JWT access + **rotating refresh tokens** (refresh stored/revocable in Redis), logout, multi-device sessions.
- User entity with **role set** (seeker, provider, admin), basic profile.
- Frontend: login page, axios instance with **interceptors** (attach token, silent refresh on 401, error normalization), Zustand auth store, **protected App Router layout**, redirect logic.
- **Review:** full Google login → land in authed area; refresh works; protected routes block unauthenticated users; logout clears session.

### Milestone 3 — Onboarding & profile

- Post-login onboarding screen: choose **seeker** or **provider** (or both later), with clean help text.
- Editable profile (avatar via MinIO presigned upload).
- **Review:** new user is routed through onboarding once; choice persists; profile edits save.

### Milestone 4 — Provider application + document uploads

- Provider application form (zod + react-hook-form): business/service details, **document images**, **selfie/photo**, uploaded to MinIO via presigned URLs with type/size validation (+ generated thumbnails).
- Provider verification state machine: `draft → submitted → approved / rejected` (with reason).
- **Review:** a user submits a provider application with images; status reflects correctly; files land in MinIO and are retrievable via signed URLs only.

### Milestone 5 — Admin verification / moderation

- Admin-only area: list pending applications, view documents, **approve/reject** with reason.
- Only approved providers become publicly discoverable.
- **Review:** admin approves a provider → that provider appears in discovery; rejected ones don't.

### Milestone 6 — Location & nearby discovery

- Provider profile stores a **discovery location** as `latitude`/`longitude` columns with a **GiST index on `ll_to_earth(latitude, longitude)`**. Nearby query uses the `earth_box(...) @>` bounding-box prefilter (index-backed) plus `earth_distance(...) <= radius` to refine and sort by distance (raw SQL / query builder via TypeORM).
- **Manual location override (privacy):** the published discovery location defaults to the device GPS but is **user-adjustable** — a draggable pin on the map (ride-share pickup style), so a provider/user need not expose their exact home. Store the chosen point; keep it distinct from live GPS.
- Frontend: request **location permission / GPS**, Leaflet map centered on the user, draggable location pin to set/adjust the published point, provider markers, distance + filters (category, radius), provider detail.
- **Review:** with location granted, nearby approved providers show on the map and list, sorted by distance; the user can manually drag/set their published location; filters work.

### Milestone 7 — Service catalog & search

- Service categories/taxonomy; providers tagged by category; search + filter + paginated listings.
- **Review:** browse/search/filter providers by category and distance with proper empty/loading states.

### Milestone 8 — Realtime: chat, live location, notifications (single socket)

- **Socket.IO** gateway (`@nestjs/platform-socket.io` + `@socket.io/redis-adapter`), one app-wide connection: a **room per service request** for 1:1 chat, an opt-in **live-location** session during an active engagement, and **`notification:new`** events. Use rooms, acknowledgements for message delivery, and the Redis adapter for cross-instance broadcast. Auth on connection via a short-lived ticket issued over REST.
- Notifications are persisted in the DB with REST endpoints for list + unread count; the socket only delivers the live push.
- Frontend: single `socket.io-client` provider/hook driving chat, live location, and the in-app notification UI.
- **Review:** two browser sessions exchange chat in realtime; notifications arrive live and survive reload (from REST); live location updates render on the map.

### Milestone 9 — Service request lifecycle + reviews

- Request flow: create → provider accept/decline → in-progress → complete (ties chat + live location to a request).
- Ratings + reviews after completion; provider aggregate rating shown in discovery.
- **Review:** full loop works end to end; ratings surface on provider cards.

### Milestone 10 — Hardening & production readiness

- Tests: unit (services/guards) + e2e on critical flows (auth, upload, nearby, request lifecycle).
- Multi-stage **production Dockerfiles** for api & web; production compose/env separation.
- Tighten throttling/security, finalize `/metrics`/observability, finalize Swagger, finalize README + runbook, seed script for a realistic demo dataset.
- **Review:** tests pass; prod images build and run; security/observability checklist satisfied.

### Milestone 11 — Payments with Stripe (DEFERRED — do not build until I ask)

- Stripe integration for paying for a completed service: payment intents, webhooks (signed), and recording transactions. Build only after Milestone 10 and on my explicit go-ahead.
- **Review:** a test-mode payment completes end to end and a webhook updates the request/transaction state.

---

## 6. Things you may have missed — decide before/while building

These are the gaps I'd flag. Defaults I'd pick are in brackets; tell me if you want otherwise.

- **Admin + verification workflow** — document uploads imply approval. I added an admin milestone. [keep]
- **Geo via `cube` + `earthdistance`** — sufficient for radius/nearest search and runs on the standard Postgres image. Only reconsider PostGIS if you later need service-area polygons or routing. [decided]
- **Single Socket.IO connection** — chat, live location, and `notification:new` all over one app-wide socket; no SSE. Notifications also persisted + served via REST so history/unread survive offline. [decided]
- **Manual location override** — published discovery location is a user-set, draggable pin (ride-share pickup style), distinct from live GPS, for privacy. [decided]
- **Socket auth** — client can't reliably set headers on the handshake; connect with a short-lived ticket issued over REST. [ticket-based]
- **Core loop** — assumed request → accept → chat → complete → review. [confirm]
- **Refresh-token rotation, logout, multi-device** — included. [keep]
- **Privacy & consent** — explicit consent for sharing live location and for storing ID documents; document retention/deletion policy. [consent prompts + data-deletion path]
- **File-upload safety** — size/type limits, thumbnails, signed-URL-only access. [included]
- **Map tiles** — OSM tiles have usage limits; make the tile URL/provider configurable and handle attribution. [configurable]
- **Phone/OTP verification** — not needed. [out]
- **i18n** — not needed for now; a11y + responsive remain in scope. [out]
- **CI/CD** — not needed yet. [out]
- **Payments (Stripe)** — Milestone 11, deferred until explicitly requested. [later]

---

## 7. Environment variables (fill in real values)

Provide these (you'll supply Google creds):

```
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=

# Auth
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ACCESS_TOKEN_TTL=
REFRESH_TOKEN_TTL=

# Postgres (standard image; cube + earthdistance enabled)
DATABASE_URL=

# Redis
REDIS_URL=

# MinIO / S3
MINIO_ENDPOINT=
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET=
MINIO_USE_SSL=

# App
API_PORT=4000
WEB_PORT=3000
WEB_ORIGIN=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SOCKET_URL=
NEXT_PUBLIC_MAP_TILE_URL=

# Stripe (Milestone 11 — deferred, leave blank for now)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Generate a matching `.env.example` (no secrets) and validate every var at boot.

---

**Start with Milestone 0. Stop after it and wait for my review.**
