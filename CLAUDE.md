# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Apartment Ultra is a multi-tenant SaaS apartment/property management system for landlords who manage multiple rental properties. It supports apartments, rooms, tenants, leases, utility tracking, billing, and business analytics with multi-user collaboration.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Web | Next.js 14 (App Router), shadcn/ui, Tailwind CSS, TypeScript |
| API | FastAPI (Python) |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.0 + Alembic migrations |
| Auth | JWT (python-jose), Passlib |
| Forms | React Hook Form, Zod validation |
| Data Fetching | TanStack Query, Axios |
| Charts | Recharts |
| Exports | ReportLab (PDF), openpyxl (Excel) |
| Package Managers | uv (Python), pnpm (Node.js) |

## Development Commands

```bash
# Start development environment
make dev-setup       # One-time setup
make dev-api         # Start API server
make dev-web         # Start Web server
make dev-docker      # Docker for all services

# Code quality
make format          # Format code
make check           # Check code
make lint            # Fix lint issues
make test            # Run tests

# Database
make migrate         # Run migrations
make migrate-create  # Create new migration
make db-reset        # Reset database

# Access points:
# - Web: http://localhost:3000
# - API docs: http://localhost:8000/docs
```

## Architecture

Project uses layered architecture (inspired by dify):

```
Controller → Service → Repository → Model
```

- **Controller**: HTTP request/response handling, input validation
- **Service**: Business logic, transaction management
- **Repository**: Data access, CRUD operations
- **Model**: ORM model definitions

### API Structure
```
api/
├── app/
│   ├── main.py              # Application entry point
│   ├── configs/             # Configuration management
│   │   ├── settings.py      # Main settings
│   │   └── database.py      # Database config
│   ├── controllers/         # API controllers
│   │   ├── console/         # Business APIs
│   │   │   ├── auth.py
│   │   │   ├── organizations.py
│   │   │   ├── apartments.py
│   │   │   ├── tenants.py
│   │   │   ├── leases.py
│   │   │   ├── utilities.py
│   │   │   ├── bills.py
│   │   │   └── reports.py
│   │   └── common/          # Shared components
│   ├── services/            # Business logic layer
│   ├── repositories/        # Data access layer
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic models
│   └── utils/               # Utility functions
├── migrations/              # Alembic migrations
├── tests/                   # Test files
├── pyproject.toml           # Project configuration
└── Dockerfile
```

### Web Structure
```
web/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── dashboard/       # Dashboard page
│   │   ├── apartments/      # Apartments management
│   │   ├── rooms/           # Rooms management
│   │   ├── tenants/         # Tenants management
│   │   ├── leases/          # Leases management
│   │   ├── utilities/       # Utility readings
│   │   ├── bills/           # Bills management
│   │   ├── reports/         # Reports & analytics
│   │   ├── settings/        # Settings pages
│   │   ├── login/           # Login page
│   │   └── register/        # Register page
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui primitives
│   │   └── ...
│   ├── lib/                 # Libraries and utilities
│   │   ├── api/             # API client
│   │   └── auth/            # Auth context
│   └── types/               # TypeScript types
├── package.json
└── Dockerfile
```

### Multi-Tenancy

All business entities have `organization_id` for data isolation. Users belong to organizations via `organization_members` with roles:
- `owner` - Full access + billing management
- `admin` - Full access
- `member` - CRUD operations
- `viewer` - Read-only access

### Database Core Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Tenant teams |
| `users` | User accounts |
| `organization_members` | User-org membership with roles |
| `apartments` | Property buildings |
| `rooms` | Individual rental units |
| `tenants` | Tenant information |
| `leases` | Rental agreements (links room + tenant) |
| `utility_readings` | Water/electricity meter readings |
| `bills` | Monthly bills |
| `payments` | Payment records |

### API Endpoints

Base path: `/api/v1/`

| Category | Endpoints |
|----------|-----------|
| Auth | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/me` |
| Organizations | `/organizations`, `/organizations/{id}/members` |
| Core | `/apartments`, `/apartments/{id}/rooms`, `/tenants`, `/leases` |
| Financial | `/utilities`, `/bills`, `/bills/{id}/payments` |
| Reports | `/reports/overview`, `/reports/income`, `/reports/occupancy` |

See `docs/API.md` for detailed API documentation.

### Key Business Logic

**Lease Management** (`api/app/services/lease_service.py`):
- Validates room availability before creating lease
- Checks for date overlap with existing leases
- Updates room status on lease creation/termination

**Bill Generation** (`api/app/services/bill_service.py`):
- Calculates utility costs from meter readings
- Supports batch generation for all active leases
- Generates PDF/Excel exports

## Development Guidelines

### Code Style
- Python: Follow PEP 8, use type hints
- TypeScript: Use strict mode, prefer explicit types
- Components: Use functional components with hooks

### Commit Convention
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- Keep commits atomic and descriptive

### Testing
- Write unit tests for services
- Write integration tests for API endpoints
- Maintain good test coverage

## Documentation

- `README.md` - Project overview and quick start
- `API.md` - Detailed API documentation
- `CLAUDE.md` - This file, for Claude Code guidance
