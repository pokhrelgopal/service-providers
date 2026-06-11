# syntax=docker/dockerfile:1
# Multi-stage production image for the NestJS API.

# ---- deps: install all deps (incl. dev) for the build ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: compile TS → dist ----
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- prod-deps: prune to production dependencies only ----
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- runtime: slim image ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# tini for proper signal handling (graceful shutdown)
RUN apk add --no-cache tini
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
# Non-root
RUN addgroup -S app && adduser -S app -G app
USER app
EXPOSE 5000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main"]
