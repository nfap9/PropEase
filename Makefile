# Apartment Ultra - Development Commands
# ==================================================================

# Variables
DOCKER_COMPOSE := docker compose
DOCKER_DIR := docker
PATH := $(HOME)/.local/bin:$(PATH)

# Shell
SHELL := /bin/bash

# Default target
.DEFAULT_GOAL := help

# ==================================================================
# Development Setup
# ==================================================================

.PHONY: dev-setup prepare-docker prepare-api prepare-web dev-clean

dev-setup: prepare-docker prepare-api prepare-web
	@echo "✅ Development environment setup complete!"
	@echo ""
	@echo "To start development:"
	@echo "  make dev-api    # Terminal 1: Start API server"
	@echo "  make dev-web    # Terminal 2: Start web server"

prepare-docker:
	@echo "🐳 Setting up Docker middleware..."
	@cp -n $(DOCKER_DIR)/middleware.env.example $(DOCKER_DIR)/middleware.env 2>/dev/null || true
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.middleware.yaml up -d
	@echo "✅ Docker middleware started (PostgreSQL, Redis)"

prepare-api:
	@echo "🔧 Setting up API environment..."
	@cp -n api/.env.example api/.env 2>/dev/null || true
	@cd api && uv sync --dev
	@cd api && uv run alembic upgrade head
	@echo "✅ API environment prepared"

prepare-web:
	@echo "🌐 Setting up web environment..."
	@cp -n web/.env.example web/.env.local 2>/dev/null || true
	@cd web && pnpm install
	@echo "✅ Web environment prepared"

dev-clean:
	@echo "⚠️  Stopping Docker containers..."
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.middleware.yaml down
	@echo "🗑️  Removing volumes..."
	@rm -rf $(DOCKER_DIR)/volumes
	@echo "✅ Cleanup complete"

# ==================================================================
# Development Servers
# ==================================================================

.PHONY: dev dev-api dev-web dev-docker

dev: dev-docker
	@echo "🚀 Starting all services..."

dev-api:
	@echo "🔧 Starting API server..."
	@cd api && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-web:
	@echo "🌐 Starting web server..."
	@cd web && pnpm dev

dev-docker:
	@echo "🐳 Starting all services with Docker..."
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.dev.yaml up

# ==================================================================
# Code Quality
# ==================================================================

.PHONY: format check lint type-check test

format:
	@echo "🎨 Formatting code..."
	@cd api && uv run ruff format app/
	@echo "✅ Code formatted"

check:
	@echo "🔍 Checking code..."
	@cd api && uv run ruff check app/
	@echo "✅ Code check complete"

lint: format
	@cd api && uv run ruff check --fix app/
	@echo "✅ Linting complete"

type-check:
	@echo "📝 Running type checks..."
	@cd api && uv run mypy app/ --ignore-missing-imports
	@echo "✅ Type checks complete"

test:
	@echo "🧪 Running tests..."
	@cd api && uv run pytest tests/ -v
	@echo "✅ Tests complete"

test-cov:
	@echo "🧪 Running tests with coverage..."
	@cd api && uv run pytest tests/ --cov=app --cov-report=html
	@echo "✅ Coverage report generated in htmlcov/"

# ==================================================================
# Database
# ==================================================================

.PHONY: migrate migrate-create migrate-down db-reset db-reset-seed db-seed-demo db-reset-demo

migrate:
	@echo "📦 Running migrations..."
	@cd api && uv run alembic upgrade head
	@echo "✅ Migrations complete"

migrate-create:
	@read -p "Enter migration message: " msg; \
	cd api && uv run alembic revision --autogenerate -m "$$msg"
	@echo "✅ Migration created"

migrate-down:
	@echo "⏪ Rolling back migration..."
	@cd api && uv run alembic downgrade -1
	@echo "✅ Rollback complete"

db-reset:
	@echo "⚠️  Resetting database..."
	@cd api && uv run python scripts/reset_db.py -y
	@echo "✅ Database reset complete"

db-reset-seed:
	@echo "⚠️  Resetting database with seed data..."
	@cd api && uv run python scripts/reset_db.py --seed -y
	@echo "✅ Database reset with admin user"

db-seed-demo:
	@echo "🌱 Seeding demo data..."
	@cd api && uv run python scripts/seed_demo.py
	@echo "✅ Demo data seeded"

db-reset-demo:
	@echo "🔄 Resetting and seeding demo data..."
	@cd api && uv run python scripts/reset_db.py -y
	@cd api && uv run python scripts/seed_demo.py
	@echo "✅ Database reset with demo data"

# ==================================================================
# Docker
# ==================================================================

.PHONY: docker-build docker-up docker-down docker-logs

docker-build:
	@echo "🔨 Building Docker images..."
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.yaml build
	@echo "✅ Images built"

docker-up:
	@echo "🚀 Starting Docker containers..."
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.yaml up -d
	@echo "✅ Containers started"
	@echo ""
	@echo "Services:"
	@echo "  Web:       http://localhost:3000"
	@echo "  API:       http://localhost:8000"
	@echo "  API Docs:  http://localhost:8000/docs"

docker-down:
	@echo "🛑 Stopping Docker containers..."
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.yaml down
	@echo "✅ Containers stopped"

docker-logs:
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.yaml logs -f

# ==================================================================
# Help
# ==================================================================

.PHONY: help

help:
	@echo "Apartment Ultra - Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make dev-setup     Setup development environment"
	@echo "  make dev-clean     Clean up development environment"
	@echo ""
	@echo "Development:"
	@echo "  make dev-api       Start API server (with hot reload)"
	@echo "  make dev-web       Start web server"
	@echo "  make dev-docker    Start all services with Docker"
	@echo ""
	@echo "Code Quality:"
	@echo "  make format        Format code with ruff"
	@echo "  make check         Check code with ruff"
	@echo "  make lint          Format and fix code"
	@echo "  make type-check    Run type checks"
	@echo "  make test          Run tests"
	@echo "  make test-cov      Run tests with coverage"
	@echo ""
	@echo "Database:"
	@echo "  make migrate       Run database migrations"
	@echo "  make migrate-create Create new migration"
	@echo "  make migrate-down  Rollback last migration"
	@echo "  make db-reset      Reset database (empty)"
	@echo "  make db-reset-seed Reset database with admin user"
	@echo "  make db-seed-demo  Seed demo/test data"
	@echo "  make db-reset-demo Reset and seed full demo data"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build  Build Docker images"
	@echo "  make docker-up     Start production containers"
	@echo "  make docker-down   Stop containers"
	@echo "  make docker-logs   View container logs"
