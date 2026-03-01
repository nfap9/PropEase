# Apartment Ultra - 开发命令入口
# 使用方式: make <target> 或 make help 查看全部命令
# ==================================================================

# -------------------------------------------------------------------
# 变量
# -------------------------------------------------------------------
DOCKER_COMPOSE := docker compose
DOCKER_DIR := docker
PATH := $(HOME)/.local/bin:$(PATH)

SHELL := /bin/bash
.DEFAULT_GOAL := help

# ==================================================================
# 开发环境初始化
# ==================================================================

.PHONY: dev-setup prepare-docker prepare-api prepare-web dev-clean

# 一键初始化：Docker 中间件 + API 依赖与迁移 + 前端依赖
dev-setup: prepare-docker prepare-api prepare-web
	@echo "✅ Development environment setup complete!"
	@echo ""
	@echo "To start development:"
	@echo "  make dev-api    # Terminal 1: Start API server"
	@echo "  make dev-web    # Terminal 2: Start web server"

# 启动 PostgreSQL、Redis 等中间件容器
prepare-docker:
	@echo "🐳 Setting up Docker middleware..."
	@cp -n $(DOCKER_DIR)/middleware.env.example $(DOCKER_DIR)/middleware.env 2>/dev/null || true
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.middleware.yaml up -d
	@echo "✅ Docker middleware started (PostgreSQL, Redis)"

# 复制 .env、安装 API 依赖、执行数据库迁移
prepare-api:
	@echo "🔧 Setting up API environment..."
	@cp -n api/.env.example api/.env 2>/dev/null || true
	@cd api && uv sync --dev
	@cd api && uv run alembic upgrade head
	@echo "✅ API environment prepared"

# 复制前端 .env、安装 pnpm 依赖
prepare-web:
	@echo "🌐 Setting up web environment..."
	@cp -n web/.env.example web/.env.local 2>/dev/null || true
	@cd web && pnpm install
	@echo "✅ Web environment prepared"

# 停止中间件容器并删除 volumes
dev-clean:
	@echo "⚠️  Stopping Docker containers..."
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.middleware.yaml down
	@echo "🗑️  Removing volumes..."
	@rm -rf $(DOCKER_DIR)/volumes
	@echo "✅ Cleanup complete"

# ==================================================================
# 开发服务器
# ==================================================================

.PHONY: dev dev-api dev-web dev-docker

dev: dev-docker
	@echo "🚀 Starting all services..."

# 本地启动 API（uvicorn 热重载，端口 8000）
dev-api:
	@echo "🔧 Starting API server..."
	@cd api && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 本地启动前端（Next.js，端口 3000）
dev-web:
	@echo "🌐 Starting web server..."
	@cd web && pnpm dev

# 使用 docker-compose.dev 启动全部服务
dev-docker:
	@echo "🐳 Starting all services with Docker..."
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.dev.yaml up

# ==================================================================
# 代码质量（后端 API：ruff / mypy / pytest）
# ==================================================================

.PHONY: format check lint type-check test test-cov

# 仅格式化代码
format:
	@echo "🎨 Formatting code..."
	@cd api && uv run ruff format app/
	@echo "✅ Code formatted"

# 仅检查（不自动修复）
check:
	@echo "🔍 Checking code..."
	@cd api && uv run ruff check app/
	@echo "✅ Code check complete"

# 格式化 + ruff 自动修复
lint: format
	@cd api && uv run ruff check --fix app/
	@echo "✅ Linting complete"

# 类型检查
type-check:
	@echo "📝 Running type checks..."
	@cd api && uv run mypy app/ --ignore-missing-imports
	@echo "✅ Type checks complete"

# 运行测试
test:
	@echo "🧪 Running tests..."
	@cd api && uv run pytest tests/ -v
	@echo "✅ Tests complete"

# 测试并生成覆盖率报告（htmlcov/）
test-cov:
	@echo "🧪 Running tests with coverage..."
	@cd api && uv run pytest tests/ --cov=app --cov-report=html
	@echo "✅ Coverage report generated in htmlcov/"

# ==================================================================
# 数据库：迁移与种子
# ==================================================================

.PHONY: migrate migrate-create migrate-down db-reset

# 执行所有未执行的迁移（upgrade head）
migrate:
	@echo "📦 Running migrations..."
	@cd api && uv run alembic upgrade head
	@echo "✅ Migrations complete"

# 根据模型变更生成新迁移（会提示输入 message）
migrate-create:
	@read -p "Enter migration message: " msg; \
	cd api && uv run alembic revision --autogenerate -m "$$msg"
	@echo "✅ Migration created"

# 回滚最近一次迁移
migrate-down:
	@echo "⏪ Rolling back migration..."
	@cd api && uv run alembic downgrade -1
	@echo "✅ Rollback complete"

# 清空数据库：删表并重建（不种子）
db-reset:
	@echo "⚠️  Resetting database..."
	@cd api && uv run python scripts/reset_db.py -y
	@echo "✅ Database reset complete"

# ==================================================================
# Docker 生产/联调（docker-compose.yaml）
# ==================================================================

.PHONY: docker-build docker-up docker-down docker-logs

# 构建镜像
docker-build:
	@echo "🔨 Building Docker images..."
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.yaml build
	@echo "✅ Images built"

# 后台启动全部服务
docker-up:
	@echo "🚀 Starting Docker containers..."
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.yaml up -d
	@echo "✅ Containers started"
	@echo ""
	@echo "Services:"
	@echo "  Web:       http://localhost:3000"
	@echo "  API:       http://localhost:8000"
	@echo "  API Docs:  http://localhost:8000/docs"

# 停止并移除容器
docker-down:
	@echo "🛑 Stopping Docker containers..."
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.yaml down
	@echo "✅ Containers stopped"

# 跟踪查看容器日志
docker-logs:
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.yaml logs -f

# ==================================================================
# 帮助
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
	@echo "  make db-reset      重置数据库（空库）"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build  Build Docker images"
	@echo "  make docker-up     Start production containers"
	@echo "  make docker-down   Stop containers"
	@echo "  make docker-logs   View container logs"
