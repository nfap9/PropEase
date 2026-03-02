#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if (cd docker && docker compose -f docker-compose.middleware.yaml exec -T postgres pg_isready -U postgres) 2>/dev/null; then
  echo "✅ 开发环境就绪"
  exit 0
else
  echo "❌ PostgreSQL 未就绪，请先执行 pnpm run dev-setup 或检查 Docker 容器（本脚本可手动执行：bash scripts/dev-check.sh）"
  exit 1
fi
