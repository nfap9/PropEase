# Technology Stack

**Analysis Date:** 2026-03-18

## Languages

**Primary:**
- TypeScript 5.x - All packages (API, web frontends, mobile, shared packages)

**Secondary:**
- Python (not detected in current codebase)
- Go (not detected in current codebase)

## Runtime

**Environment:**
- Node.js 18+ (API, build tools, dev server)
- React Native 0.83.2 (mobile app)

**Package Manager:**
- pnpm 10+ with workspaces
- Catalog for unified dependency versioning across monorepo
- Lockfile: `pnpm-lock.yaml` (present)

## Frameworks

**Core Backend:**
- Express 4.x - HTTP server framework
- Prisma 7.x - ORM for PostgreSQL
- Zod 3.x - Schema validation

**Frontend:**
- Next.js 14.x - React framework for tenant-web and admin-web
- React 18.x - UI library
- Radix UI - Unstyled component primitives
- Tailwind CSS 3.x - Utility-first CSS framework
- TanStack Query 5.x - Server state management
- Zustand 5.x - Client state (mobile only)
- Tamagui 2.x - Mobile UI components (mobile only)
- Expo 55.x - React Native framework (mobile only)

**Testing:**
- Vitest 1.x - Test runner (API, shared packages)
- Vitest 4.x - Test runner (tenant-web, admin-web)
- Playwright 1.x - E2E testing
- Testing Library (React) - Component testing

**Build/Dev:**
- tsx - TypeScript execution for development
- esbuild - Fast bundling
- Dockerfile - Container builds

## Key Dependencies

**API Core:**
- `@prisma/client` 7.x - Database ORM
- `@prisma/adapter-pg` 7.x - PostgreSQL adapter
- `express` 4.x - Web framework
- `cors` 2.x - CORS middleware
- `bcryptjs` 2.x - Password hashing
- `jsonwebtoken` - JWT tokens (implied from JWT usage)
- `zod` 3.x - Schema validation
- `ulid` 2.x - Unique ID generation
- `node-cron` 3.x - Task scheduling

**API Infrastructure:**
- `@opentelemetry/*` - Observability/tracing
- `swagger-jsdoc` / `swagger-ui-express` - API documentation
- `pdf-lib` - PDF generation
- `exceljs` - Excel export

**Frontend Core:**
- `next` 14.x - React framework
- `@tanstack/react-query` 5.x - Server state
- `@radix-ui/react-*` - UI primitives
- `tailwindcss` 3.x - Styling
- `lucide-react` - Icons
- `recharts` - Charts/visualization
- `date-fns` - Date utilities
- `react-hook-form` - Form handling
- `zod` + `@hookform/resolvers` - Form validation

**Mobile Only:**
- `expo` 55.x - React Native framework
- `expo-router` 55.x - File-based routing
- `expo-secure-store` - Secure storage
- `tamagui` 2.x - UI components
- `react-native-reanimated` 4.x - Animations
- `react-native-screens` - Navigation
- `react-native-safe-area-context` - Safe area handling

## Configuration

**Environment:**
- Environment variables via `dotenv` (API)
- `.env` files for local development
- `.env.example` for documentation
- Zod schema validation on startup (`api/src/config.ts`)

**Build:**
- `tsconfig.base.json` - Base TypeScript config
- `tsconfig.nextjs.json` - Next.js specific
- `pnpm-workspace.yaml` - Monorepo setup
- `catalog` in `pnpm-workspace.yaml` - Centralized versions

## Platform Requirements

**Development:**
- Node.js 18+
- Docker and Docker Compose (for middleware services)
- PostgreSQL 15 (via Docker)
- Redis 7 (via Docker)
- pnpm 10+

**Production:**
- Node.js 18+ (production build)
- PostgreSQL 15+ (external)
- Redis 7+ (external)
- Nginx (reverse proxy)
- Docker for containerization

---

*Stack analysis: 2026-03-18*
