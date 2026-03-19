# Technology Stack

**Analysis Date:** 2026-03-19

## Languages

**Primary:**
- TypeScript 5 - All packages (api, web, mobile, shared packages)
- Node.js ESM - Backend API (TypeScript NodeNext module format)

**Secondary:**
- CSS/Tailwind - Frontend styling (via Tailwind CSS 3.4)
- Expo/React Native - Mobile client (JavaScript/TypeScript)

## Runtime

**Environment:**
- Node.js >=18 - API, tenant-web, admin-web, shared packages
- React Native 0.83 - Mobile client
- Expo SDK 55 - Mobile framework

**Package Manager:**
- pnpm 10+ (workspace-based monorepo)
- Lockfile: `pnpm-lock.yaml`
- Catalog mode for shared dependency versions

## Frameworks

**Core (API):**
- Express 4.21 - HTTP server framework
- Prisma 7.4 - ORM (PostgreSQL adapter via `@prisma/adapter-pg`)
- node-cron 3.0 - Job scheduling

**Core (Web):**
- Next.js 14.2.35 - React SSR/SSG framework for `tenant-web` and `admin-web`
- React 18 - UI library (frontend applications)
- React 19 - Mobile client

**Mobile:**
- Expo 55 - React Native development platform
- expo-router 55 - File-based routing
- Tamagui 2.0-rc - UI component library (mobile)
- Zustand 5 - State management (mobile)

**Testing:**
- Vitest 1.6 (api), Vitest 4 (web) - Unit/integration testing
- Playwright 1.58 - E2E testing
- Testing Library (React) - Component testing

**Build/Dev:**
- tsx - TypeScript execution for API dev
- Prettier 3.8 + prettier-plugin-tailwindcss - Code formatting

## Key Dependencies

**API Critical:**
- `express` - HTTP server
- `prisma` / `@prisma/client` - Database ORM with PostgreSQL
- `@prisma/adapter-pg` - Prisma PostgreSQL driver adapter
- `pg` - PostgreSQL client
- `bcryptjs` - Password hashing
- `zod` - Runtime validation
- `swagger-jsdoc` / `swagger-ui-express` - API documentation
- `exceljs` - Excel export
- `pdf-lib` - PDF generation
- `ulid` - ID generation

**API Observability:**
- `@opentelemetry/sdk-node` - Telemetry
- `@opentelemetry/exporter-trace-otlp-grpc` - Trace export
- `@opentelemetry/exporter-metrics-otlp-grpc` - Metrics export
- `@opentelemetry/instrumentation-http` - HTTP instrumentation
- `@opentelemetry/instrumentation-express` - Express instrumentation
- `@prisma/instrumentation` - Prisma instrumentation

**Frontend Critical:**
- `next` 14.2.35 - Framework
- `@tanstack/react-query` 5.90 - Server state
- `@tanstack/react-table` 8.21 - Table component
- `@radix-ui/*` - Unstyled accessible components (dialog, dropdown, tooltip, etc.)
- `tailwindcss` 3.4 - Styling
- `recharts` 3.7 - Charts
- `react-hook-form` 7.71 + `@hookform/resolvers` - Form handling
- `zod` 3.25 - Schema validation
- `axios` 1.13 - HTTP client
- `sonner` 2.0 - Toast notifications
- `date-fns` 4.1 - Date utilities
- `lucide-react` - Icon library
- `class-variance-authority` - Variant class generation
- `clsx` / `tailwind-merge` - Class name utilities

**Shared Packages:**
- `@apartment-ultra/api-contract` - Shared TypeScript types/contracts
- `@apartment-ultra/web-api-client` - Axios-based API client for frontend
- `@apartment-ultra/shared-ui` - Shared React UI components

**Mobile Critical:**
- `expo` 55 - Framework
- `expo-router` 55 - File-based routing
- `tamagui` 2.0-rc - UI components
- `@tanstack/react-query` - Data fetching
- `react-native-reanimated` 4.2 - Animations
- `expo-secure-store` 55 - Secure storage
- `zustand` 5 - State management

## Configuration

**Environment:**
- Root `package.json` - Monorepo workspace config, pnpm catalog overrides
- `api/.env` / `api/.env.example` - API env vars (database, JWT, CORS, WeChat Pay, OpenTelemetry)
- `docker/middleware.env` - PostgreSQL and Redis config for local Docker
- `pnpm-workspace.yaml` - pnpm workspace declaration

**Build:**
- `api/tsconfig.json` - NodeNext, ES2022 target, strict
- `tenant-web/tsconfig.json` / `admin-web/tsconfig.json` - Extends `tsconfig.nextjs.json`
- `api/vitest.config.ts` - Node environment, v8 coverage, path alias `@`
- `tenant-web/vitest.config.ts` - jsdom environment, React plugin
- `tailwind.config.ts` - In `tenant-web/` and `admin-web/`
- `postcss.config.mjs` - PostCSS with Tailwind

**Linting:**
- `api/.eslintrc.cjs` - TypeScript ESLint, `@typescript-eslint` plugin, `no-explicit-any: error`

**Formatting:**
- `.prettierrc` (implicit) - Prettier defaults
- `prettier-plugin-tailwindcss` - Tailwind class sorting

## Platform Requirements

**Development:**
- Node.js >=18
- pnpm 10+
- Docker (for PostgreSQL, Redis middleware)
- PostgreSQL 15 (or Docker)
- Redis 7 (or Docker)

**Production:**
- Node.js >=18 (API)
- PostgreSQL 15 (database)
- Redis 7 (session/cache - present in compose but not actively used in code)
- Next.js compatible hosting (Vercel, Railway, etc.)

---

*Stack analysis: 2026-03-19*
