#!/usr/bin/env bash
if lsof -ti :8000 2>/dev/null | xargs kill 2>/dev/null; then
  echo "✅ 已停止后端 (8000)"
else
  echo "未发现占用 8000 端口的进程"
fi
