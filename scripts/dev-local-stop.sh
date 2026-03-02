#!/usr/bin/env bash
# 停止前端 (Next.js 默认 3000)
if lsof -ti :3000 2>/dev/null | xargs kill 2>/dev/null; then
  echo "✅ 已停止前端 (3000)"
else
  echo "未发现占用 3000 端口的进程"
fi
# 停止后端 (api 8000)
if lsof -ti :8000 2>/dev/null | xargs kill 2>/dev/null; then
  echo "✅ 已停止后端 (8000)"
else
  echo "未发现占用 8000 端口的进程"
fi
