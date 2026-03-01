#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "🚀 一键启动后端 + 前端（后端后台，前端前台）..."
echo "  后端: http://localhost:8000  前端: http://localhost:3000"
(pnpm run dev:api) &
pnpm run dev:web
true
