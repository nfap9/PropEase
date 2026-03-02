#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "🐳 启动 Docker 中间件..."
cp -n docker/middleware.env.example docker/middleware.env 2>/dev/null || true
cp -n api/.env.example api/.env 2>/dev/null || true
cp -n web/.env.example web/.env.local 2>/dev/null || true

cd docker && docker compose -f docker-compose.middleware.yaml up -d
cd "$ROOT"

echo "⏳ 等待 PostgreSQL 就绪..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if (cd docker && docker compose -f docker-compose.middleware.yaml exec -T postgres pg_isready -U postgres) 2>/dev/null; then
    break
  fi
  sleep 2
done
(cd docker && docker compose -f docker-compose.middleware.yaml exec -T postgres pg_isready -U postgres) || {
  echo "❌ PostgreSQL 未就绪，请检查 Docker 容器"
  exit 1
}
echo "✅ 中间件已启动（PostgreSQL、Redis）"

echo "🔧 配置 api 环境..."
pnpm install
pnpm --filter apartment-ultra-api exec prisma generate
echo "✅ api 环境就绪"

echo "🌐 配置前端环境就绪"

echo ""
echo "✅ 开发环境已就绪！"
echo ""
echo "启动开发服务："
echo "  终端 1: pnpm run dev:api   # 启动后端（端口 8000）"
echo "  终端 2: pnpm run dev:web   # 启动前端"
echo ""
echo "或一键启动（后端+前端同终端，Ctrl+C 同时退出）: pnpm run dev:local"
