#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "⚠️  停止 Docker 容器..."
cd docker && docker compose -f docker-compose.middleware.yaml down
cd "$ROOT"
echo "🗑️  删除 volumes..."
rm -rf docker/volumes
echo "✅ 清理完成"
