# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Apartment Ultra is a multi-tenant SaaS apartment/property management system for landlords who manage multiple rental properties. It supports apartments, rooms, tenants, leases, utility tracking, billing, and business analytics with multi-user collaboration.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), shadcn/ui, Tailwind CSS, TypeScript |
| Backend | FastAPI (Python) |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.0 with Alembic migrations |
| Auth | JWT (python-jose), Passlib |
| Forms | React Hook Form, Zod validation |
| Data Fetching | TanStack Query, Axios |
| Charts | Recharts |
| Exports | ReportLab (PDF), openpyxl (Excel) |

## Development Commands

```bash
# Start development environment (all services)
docker-compose up

# Access points after startup:
# - Frontend: http://localhost:3000
# - Backend API docs: http://localhost:8000/docs
```

### Frontend (from frontend/ directory)
```bash
npm run dev        # Development server
npm run build      # Production build
npm run lint       # ESLint
npm run type-check # TypeScript check
```

### Backend (from backend/ directory)
```bash
# Run migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Development server
uvicorn app.main:app --reload

# Run tests
pytest
```

## Architecture

### Backend Structure
```
backend/app/
├── main.py          # FastAPI entry point
├── config.py        # Environment configuration
├── database.py      # PostgreSQL connection
├── dependencies.py  # DI for auth/permissions
├── models/          # SQLAlchemy ORM models
├── schemas/         # Pydantic request/response models
├── routers/         # API route handlers
├── services/        # Business logic layer
└── utils/           # PDF/Excel generation, security
```

**Pattern:** Routers → Services → Models (layered architecture)

### Frontend Structure
```
frontend/src/
├── app/             # Next.js App Router pages
├── components/
│   ├── ui/          # shadcn/ui primitives
│   ├── layout/      # Layout components
│   ├── forms/       # Form components
│   └── charts/      # Chart components
├── lib/api/         # API client with Axios
├── lib/auth/        # Auth context and hooks
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
└── store/           # Zustand state (optional)
```

### Multi-Tenancy

All business entities have `organization_id` for data isolation. Users belong to organizations via `organization_members` with roles:
- `owner` - Full access, billing
- `admin` - Full access, no billing
- `member` - CRUD operations
- `viewer` - Read-only

### Database Core Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Teams/tenants |
| `users` | User accounts |
| `organization_members` | User-org membership with roles |
| `apartments` | Property buildings |
| `rooms` | Individual rental units |
| `tenants` | Tenant information |
| `leases` | Rental agreements (links room + tenant) |
| `utility_readings` | Water/electricity meter readings |
| `bills` | Monthly bills |
| `payments` | Payment records |

### API Structure

Base path: `/api/v1/`

- `/auth/*` - Authentication (register, login, refresh, me)
- `/organizations/*` - Organization management
- `/apartments/*`, `/rooms/*`, `/tenants/*`, `/leases/*` - CRUD resources
- `/utilities/*` - Utility meter readings
- `/bills/*` - Bills and PDF/Excel exports
- `/reports/*` - Analytics and statistics

### Key Business Logic

**Lease Management** (`backend/app/services/lease_service.py`):
- Validates room availability before creating lease
- Checks for date overlap with existing leases
- Updates room status on lease creation/termination

**Bill Generation** (`backend/app/services/bill_service.py`):
- Calculates utility costs from meter readings
- Supports batch generation for all active leases
- Generates PDF/Excel exports

## Implementation Phases

1. **Phase 1:** Infrastructure (Next.js, FastAPI, PostgreSQL, JWT auth)
2. **Phase 2:** Core business (apartments, rooms, tenants, leases)
3. **Phase 3:** Financial (utilities, bills, payments, exports)
4. **Phase 4:** Analytics (dashboard, charts, reports)
5. **Phase 5:** Multi-user collaboration (organizations, RBAC)

See `实现计划.md` for detailed implementation checklist.
