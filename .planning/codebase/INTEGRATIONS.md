# External Integrations

**Analysis Date:** 2026-03-19

## APIs & External Services

**Payments:**
- WeChat Pay (Native QR code payment for service plans)
  - SDK: Native API calls via REST (no SDK package)
  - Auth: `WECHAT_MCH_ID`, `WECHAT_APP_ID`, `WECHAT_APIV3_KEY`, `WECHAT_CERT_SERIAL_NO`
  - Config: `WECHAT_PAY_ENABLED`, `WECHAT_PAY_NOTIFY_URL_BASE`
  - Auth mechanism: WeChat Pay APIv3 with RSA certificate
  - Env vars in `api/.env.example` - all optional, payments are simulated if disabled

## Data Storage

**Primary Database:**
- PostgreSQL 15
  - Connection: `DATABASE_URL` env var (e.g., `postgresql://postgres:postgres@localhost:5432/apartment_ultra`)
  - ORM: Prisma 7 with `@prisma/adapter-pg` (Pg driver adapter)
  - Schema: `api/prisma/schema.prisma`
  - Models include: User, Organization, Apartment, Room, Tenant, Lease, Bill, Payment, Notification, Subscription, CustomRole, UsageQuota, etc.

**Cache/Session:**
- Redis 7 (defined in docker-compose.middleware.yaml)
  - Connection: `REDIS_PORT` env var
  - Present in infrastructure but **not actively used** in application code (no Redis client imported anywhere)
  - Available for future session/caching needs

**File Storage:**
- Local filesystem only (no cloud storage integration)
- Backup directory: `docker/backup` (PostgreSQL backup mount)

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication
  - Library: `bcryptjs` for password hashing
  - Tokens: HS256 signed JWT (access + refresh tokens)
  - Access token expiry: 30 minutes (configurable)
  - Refresh token expiry: 7 days (configurable)
  - Admin separate token config: 30 minutes expiry
  - Env vars: `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`
  - Two user systems: Platform users (with phone/password) and Admin users (separate auth)

**Session:**
- Stateless JWT (no server-side session storage)
- Refresh token flow implemented

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Bugsnag, or similar)

**Distributed Tracing & Metrics:**
- OpenTelemetry (optional, disabled by default)
  - Enabled via `OTEL_ENABLED=true`
  - Endpoint: `OTEL_EXPORTER_OTLP_ENDPOINT` (default `http://localhost:4317`)
  - Trace exporter: `OTLPTraceExporter` via gRPC
  - Metric exporter: `OTLPMetricExporter` via gRPC
  - Instrumentations: HTTP, Express, Prisma
  - Implementation: `api/src/observability/index.ts`

**Logs:**
- Console logging (no structured logging framework detected)

## CI/CD & Deployment

**Hosting:**
- Not detected (no Vercel, Railway, AWS, etc. config found)
- Docker Compose for local full-stack deployment: `docker/docker-compose.yaml`
- Docker Compose for middleware only: `docker/docker-compose.middleware.yaml`
- Docker Compose for dev: `docker/docker-compose.dev.yaml`

**CI Pipeline:**
- GitHub Actions
  - `ci.yml` - Lint, type-check, test pipeline
  - `deploy.yml` - Deployment workflow
  - Config: `.github/workflows/`

**E2E Testing:**
- Playwright (see `playwright.config.ts` at root)
  - Browser: Chromium (default, Firefox/WebKit available but disabled)
  - Test dir: `e2e/`
  - Report output: `e2e/results/report`
  - Web server auto-start via `pnpm dev:web` (port 3000)
  - Base URL: `http://localhost:3000` (configurable via `E2E_BASE_URL`)

## Environment Configuration

**Required env vars (API - `api/.env.example`):**

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `SECRET_KEY` | JWT signing key (>=32 chars in prod) | Yes |
| `ALGORITHM` | JWT algorithm (HS256) | Yes |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | Yes |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | Yes |
| `ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES` | Admin token TTL | Yes |
| `CORS_ORIGINS` | Allowed origins JSON array | Yes |
| `APP_NAME` | Application name | Yes |
| `DEBUG` | Debug mode flag | Yes |
| `API_V1_PREFIX` | API version prefix | Yes |
| `OTEL_ENABLED` | Enable OpenTelemetry | No |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP gRPC endpoint | No |
| `WECHAT_PAY_ENABLED` | Enable WeChat Pay | No |
| `WECHAT_MCH_ID` | WeChat merchant ID | No |
| `WECHAT_APP_ID` | WeChat app ID | No |
| `WECHAT_APIV3_KEY` | WeChat APIv3 key | No |
| `WECHAT_CERT_SERIAL_NO` | WeChat cert serial | No |
| `WECHAT_PAY_NOTIFY_URL_BASE` | Payment callback base URL | No |

**Secrets location:**
- `api/.env` (local, gitignored)
- `docker/middleware.env` (PostgreSQL/Redis credentials, gitignored)
- Docker env files for different environments (`.env.docker`, `.env.dev`)

## Webhooks & Callbacks

**Incoming:**
- WeChat Pay payment notification callback
  - Endpoint: `${WECHAT_PAY_NOTIFY_URL_BASE}/api/v1/payments/wechat/notify`
  - Handles payment success/failure notifications from WeChat

**Outgoing:**
- None detected (no outbound webhook integrations)

---

*Integration audit: 2026-03-19*
