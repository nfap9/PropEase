# External Integrations

**Analysis Date:** 2026-03-18

## APIs & External Services

**Payment Processing:**
- WeChat Pay (Native扫码支付)
  - SDK/Client: Direct API integration via `api/src/services/wechatPayNative.ts`
  - Env vars: `WECHAT_PAY_ENABLED`, `WECHAT_MCH_ID`, `WECHAT_APP_ID`, `WECHAT_CERT_SERIAL_NO`, `WECHAT_APIV3_KEY`, `WECHAT_PRIVATE_KEY` / `WECHAT_PRIVATE_KEY_PATH`, `WECHAT_PAY_NOTIFY_URL_BASE`
  - Status: Optional - disabled by default

**SMS Notifications:**
- Webhook-based SMS gateway
  - SDK/Client: Custom HTTP webhook integration
  - Env vars: `SMS_NOTIFICATIONS_ENABLED`, `SMS_WEBHOOK_URL`, `SMS_WEBHOOK_TOKEN`, `SMS_SENDER_SIGN`
  - Status: Optional - disabled by default
  - Implementation: `api/src/services/notification.service.ts`

**Observability:**
- OpenTelemetry with Jaeger
  - SDK/Client: `@opentelemetry/*` packages
  - Endpoint: Configurable via `OTEL_EXPORTER_OTLP_ENDPOINT` (default: `http://localhost:4317`)
  - Status: Optional - disabled by default via `OTEL_ENABLED`
  - Implementation: `api/src/observability/index.ts`

## Data Storage

**Databases:**
- PostgreSQL 15
  - Connection: `DATABASE_URL` environment variable
  - ORM: Prisma 7.x
  - Client: `@prisma/client`
  - Schema: `api/prisma/schema.prisma`
  - Used by: API backend

**Caching:**
- Redis 7
  - Connection: Configured in docker-compose
  - Used for: Session/token storage, rate limiting (implied from docker-compose)
  - Implementation: Not explicitly found in current codebase - may be prepared for future use

**File Storage:**
- Local filesystem only (current implementation)
- Note: `pdf-lib` for PDF generation in-memory, no external file storage integration

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication
  - Implementation: `api/src/utils/jwt.ts`, `api/src/services/auth.service.ts`
  - Tokens: Access token (default 30 min) + Refresh token (default 7 days)
  - Algorithm: HS256
  - Secret: `SECRET_KEY` env var (required 32+ chars in production)
  - Password hashing: bcryptjs

**Admin Authentication:**
- Separate JWT-based auth for admin panel
  - Implementation: `api/src/routes/v1/admin/auth.ts`
  - Token expiry: `ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES`

## Monitoring & Observability

**Error Tracking:**
- Not explicitly configured (no Sentry, Bugsnag, etc.)

**Logs:**
- Console logging via `console.log/error`
- JSON file logging in production (via Docker)

**Distributed Tracing:**
- OpenTelemetry
  - Jaeger integration available
  - OTLP gRPC/HTTP exporters
  - Instrumentation: Express, HTTP

## CI/CD & Deployment

**Hosting:**
- Self-hosted (Docker-based deployment)
- Docker Compose for orchestration
- Nginx as reverse proxy

**CI Pipeline:**
- Not explicitly configured (no GitHub Actions, GitLab CI, etc.)
- Local Playwright for E2E tests

**Container Images:**
- `apartment-ultra-api` - Node.js API
- `apartment-ultra-tenant-web` - Next.js tenant frontend
- `apartment-ultra-admin-web` - Next.js admin frontend

## Environment Configuration

**Required env vars (API):**
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT signing key (32+ characters in production)
- `CORS_ORIGINS` - Allowed origins (JSON array or "*")

**Optional env vars:**
- `NODE_ENV` - Environment (production/development)
- `IS_DEV` - Development mode override
- `OTEL_ENABLED` - Enable OpenTelemetry
- `OTEL_EXPORTER_OTLP_ENDPOINT` - OTLP endpoint
- `WECHAT_PAY_*` - WeChat Pay configuration
- `SMS_NOTIFICATIONS_*` - SMS gateway configuration

**Frontend env vars:**
- `NEXT_PUBLIC_API_URL` - API URL for tenant-web/admin-web

## Webhooks & Callbacks

**Incoming:**
- WeChat Pay callback
  - Endpoint: `/api/v1/webhooks/wechatPay`
  - Implementation: `api/src/routes/v1/webhooks/wechatPay.ts`
  - URL base: `WECHAT_PAY_NOTIFY_URL_BASE`

**Outgoing:**
- SMS webhook (optional)
  - Triggered when sending SMS notifications to tenants

---

*Integration audit: 2026-03-18*
