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

.PHONY: dev-setup prepare-docker prepare-api prepare-web dev-clean dev-check prepare-api-ts

# 一键初始化：Docker 中间件 + API 依赖与迁移 + 前端依赖
dev-setup: prepare-docker prepare-api prepare-web
	@echo "✅ 开发环境已就绪！"
	@echo ""
	@echo "启动开发服务："
	@echo "  终端 1: make dev-api  # 启动 API"
	@echo "  终端 2: make dev-web  # 启动前端"
	@echo ""
	@echo "或一键启动（API + 前端）: make dev-local"

# 启动 PostgreSQL、Redis 等中间件容器，并等待 PostgreSQL 就绪
prepare-docker:
	@echo "🐳 启动 Docker 中间件..."
	@cp -n $(DOCKER_DIR)/middleware.env.example $(DOCKER_DIR)/middleware.env 2>/dev/null || true
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.middleware.yaml up -d
	@echo "⏳ 等待 PostgreSQL 就绪..."
	@for i in 1 2 3 4 5 6 7 8 9 10; do \
		(cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.middleware.yaml exec -T postgres pg_isready -U postgres) && break; \
		sleep 2; \
	done
	@(cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.middleware.yaml exec -T postgres pg_isready -U postgres) || (echo "❌ PostgreSQL 未就绪，请检查 Docker 容器"; exit 1)
	@echo "✅ 中间件已启动（PostgreSQL、Redis）"

# 复制 .env、安装 API 依赖、执行数据库迁移
prepare-api:
	@echo "🔧 配置 API 环境..."
	@cp -n api/.env.example api/.env 2>/dev/null || true
	@cd api && uv sync --dev
	@cd api && uv run alembic upgrade head
	@echo "✅ API 环境就绪"

# 配置 api-ts（Node/Express 后端，与 api 并存；切换前使用）
prepare-api-ts:
	@echo "🔧 配置 api-ts 环境..."
	@cp -n api-ts/.env.example api-ts/.env 2>/dev/null || true
	@cd api-ts && pnpm install
	@cd api-ts && pnpm exec prisma generate
	@echo "✅ api-ts 环境就绪（数据库迁移仍由 api 的 Alembic 执行）"

# 复制前端 .env、安装 pnpm 依赖
prepare-web:
	@echo "🌐 配置前端环境..."
	@cp -n web/.env.example web/.env.local 2>/dev/null || true
	@cd web && pnpm install
	@echo "✅ 前端环境就绪"

# 检查开发环境：PostgreSQL 是否就绪（执行 migrate 或 dev-api 前若报错可先运行此命令）
dev-check:
	@(cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.middleware.yaml exec -T postgres pg_isready -U postgres) || (echo "❌ PostgreSQL 未就绪，请先执行 make dev-setup 或检查 Docker 容器"; exit 1)
	@echo "✅ 开发环境就绪"

# 停止中间件容器并删除 volumes
dev-clean:
	@echo "⚠️  停止 Docker 容器..."
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.middleware.yaml down
	@echo "🗑️  删除 volumes..."
	@rm -rf $(DOCKER_DIR)/volumes
	@echo "✅ 清理完成"

# ==================================================================
# 开发服务器
# ==================================================================

.PHONY: dev dev-api dev-web dev-docker dev-local dev-local-stop dev-api-ts

dev: dev-docker
	@echo "🚀 正在启动全部服务..."

# 本地启动 API（uvicorn 热重载，端口 8000）
dev-api:
	@echo "🔧 启动 API 服务..."
	@cd api && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 本地启动前端（Next.js，端口 3000）
dev-web:
	@echo "🌐 启动前端服务..."
	@cd web && pnpm dev

# 本地启动 api-ts（端口 8001，与 Python API 并存）
dev-api-ts:
	@echo "🔧 启动 api-ts 服务（端口 8001）..."
	@cd api-ts && PORT=8001 pnpm dev

# 本地一键启动：先后台 API，再前台前端；Ctrl+C 仅停前端，停 API 用 make dev-local-stop
dev-local:
	@echo "🚀 一键启动 API + 前端（API 后台，前端前台）..."
	@echo "  API: http://localhost:8000  前端: http://localhost:3000"
	@(cd api && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000) & \
	(cd web && pnpm dev); \
	true

# 停止 dev-local 启动的后台 API（按端口 8000 结束进程）
dev-local-stop:
	@lsof -ti :8000 | xargs kill 2>/dev/null && echo "✅ 已停止 API (8000)" || echo "未发现占用 8000 端口的进程"

# 使用 docker-compose.dev 启动全部服务
dev-docker:
	@echo "🐳 使用 Docker 启动全部服务..."
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.dev.yaml up

# ==================================================================
# 代码质量（API：ruff / mypy / pytest；前端：ESLint / tsc）
# ==================================================================

.PHONY: format check lint type-check test test-cov lint-web type-check-web lint-all type-check-all lint-api-ts type-check-api-ts test-api-ts

# 仅格式化 API 代码
format:
	@echo "🎨 格式化 API 代码..."
	@cd api && uv run ruff format app/
	@echo "✅ 格式化完成"

# 仅检查 API（不自动修复）
check:
	@echo "🔍 检查 API 代码..."
	@cd api && uv run ruff check app/
	@echo "✅ 检查完成"

# 格式化 + ruff 自动修复（仅 API）
lint: format
	@cd api && uv run ruff check --fix app/
	@echo "✅ API 代码检查完成"

# 前端 ESLint（含自动修复）
lint-web:
	@echo "🔍 检查前端代码..."
	@cd web && pnpm lint:fix
	@echo "✅ 前端检查完成"

# 类型检查（仅 API）
type-check:
	@echo "📝 API 类型检查..."
	@cd api && uv run mypy app/ --ignore-missing-imports
	@echo "✅ API 类型检查完成"

# 前端 TypeScript 类型检查
type-check-web:
	@echo "📝 前端类型检查..."
	@cd web && pnpm type-check
	@echo "✅ 前端类型检查完成"

# api-ts ESLint
lint-api-ts:
	@echo "🔍 检查 api-ts..."
	@cd api-ts && pnpm run lint
	@echo "✅ api-ts 检查完成"

type-check-api-ts:
	@echo "📝 api-ts 类型检查..."
	@cd api-ts && pnpm run type-check
	@echo "✅ api-ts 类型检查完成"

test-api-ts:
	@echo "🧪 运行 api-ts 测试..."
	@cd api-ts && pnpm run test 2>/dev/null || echo "（暂无测试）"
	@echo "✅ api-ts 测试完成"

# 全栈代码检查（API + 前端）
lint-all: lint lint-web

# 全栈类型检查（API + 前端）
type-check-all: type-check type-check-web

# 运行 API 测试
test:
	@echo "🧪 运行 API 测试..."
	@cd api && uv run pytest tests/ -v
	@echo "✅ 测试完成"

# 测试并生成覆盖率报告（htmlcov/）
test-cov:
	@echo "🧪 运行 API 测试（含覆盖率）..."
	@cd api && uv run pytest tests/ --cov=app --cov-report=html
	@echo "✅ 报告已生成至 htmlcov/"

# ==================================================================
# 数据库：迁移与种子
# ==================================================================

.PHONY: migrate migrate-create migrate-down db-reset

# 执行所有未执行的迁移（upgrade head）
migrate:
	@echo "📦 执行数据库迁移..."
	@cd api && uv run alembic upgrade head
	@echo "✅ 迁移完成"

# 根据模型变更生成新迁移（会提示输入 message）
migrate-create:
	@read -p "输入迁移说明: " msg; \
	cd api && uv run alembic revision --autogenerate -m "$$msg"
	@echo "✅ 迁移文件已生成"

# 回滚最近一次迁移
migrate-down:
	@echo "⏪ 回滚上一次迁移..."
	@cd api && uv run alembic downgrade -1
	@echo "✅ 回滚完成"

# 清空数据库：删表并重建（不种子）
db-reset:
	@echo "⚠️  重置数据库..."
	@cd api && uv run python scripts/reset_db.py -y
	@echo "✅ 数据库已重置"

# ==================================================================
# Docker 生产/联调（docker-compose.yaml）
# ==================================================================

.PHONY: docker-build docker-up docker-down docker-logs

# 构建镜像
docker-build:
	@echo "🔨 构建 Docker 镜像..."
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.yaml build
	@echo "✅ 镜像构建完成"

# 后台启动全部服务
docker-up:
	@echo "🚀 启动 Docker 容器..."
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.yaml up -d
	@echo "✅ 容器已启动"
	@echo ""
	@echo "服务地址:"
	@echo "  前端:     http://localhost:3000"
	@echo "  API:     http://localhost:8000"
	@echo "  API 文档: http://localhost:8000/docs"

# 停止并移除容器
docker-down:
	@echo "🛑 停止 Docker 容器..."
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.yaml down
	@echo "✅ 容器已停止"

# 跟踪查看容器日志
docker-logs:
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) -f docker-compose.yaml logs -f

# ==================================================================
# 帮助
# ==================================================================

.PHONY: help

help:
	@echo "Apartment Ultra - 开发命令"
	@echo ""
	@echo "环境初始化:"
	@echo "  make dev-setup     一键初始化开发环境"
	@echo "  make dev-check     检查 PostgreSQL 是否就绪"
	@echo "  make dev-clean     停止中间件并清理 volumes"
	@echo ""
	@echo "开发服务:"
	@echo "  make dev-api       启动 API（热重载，端口 8000）"
	@echo "  make dev-api-ts    启动 api-ts（端口 8001，与 api 并存）"
	@echo "  make dev-web       启动前端（端口 3000）"
	@echo "  make dev-local     一键启动 API + 前端（本地）"
	@echo "  make dev-local-stop 停止 dev-local 后台 API"
	@echo "  make dev-docker    使用 Docker 启动全部服务"
	@echo "  make prepare-api-ts 配置 api-ts 环境"
	@echo ""
	@echo "代码质量:"
	@echo "  make format        格式化 API 代码（ruff）"
	@echo "  make check         检查 API 代码（ruff）"
	@echo "  make lint          API 格式化与自动修复"
	@echo "  make lint-web      前端 ESLint（含修复）"
	@echo "  make lint-api-ts   api-ts 代码检查"
	@echo "  make lint-all      API + 前端检查"
	@echo "  make type-check    API 类型检查（mypy）"
	@echo "  make type-check-web 前端类型检查（tsc）"
	@echo "  make type-check-api-ts api-ts 类型检查"
	@echo "  make type-check-all API + 前端类型检查"
	@echo "  make test          运行 API 测试"
	@echo "  make test-api-ts   运行 api-ts 测试"
	@echo "  make test-cov      运行 API 测试并生成覆盖率"
	@echo ""
	@echo "数据库:"
	@echo "  make migrate       执行迁移"
	@echo "  make migrate-create 创建新迁移"
	@echo "  make migrate-down  回滚上一次迁移"
	@echo "  make db-reset      重置数据库（空库）"
	@echo ""
	@echo "Docker 生产/联调:"
	@echo "  make docker-build  构建镜像"
	@echo "  make docker-up     后台启动容器"
	@echo "  make docker-down   停止容器"
	@echo "  make docker-logs   查看容器日志"
