#!/usr/bin/env bash
# 精确匹配本项目启动的前后端进程（按命令而非端口）
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

stop_by_pattern() {
  local pattern="$1"
  local label="$2"
  local check_root="${3:-false}"
  local found=0
  local pids
  pids=$(pgrep -f "$pattern" 2>/dev/null || true)
  for pid in $pids; do
    if [[ "$check_root" == "true" ]]; then
      local cmd
      cmd=$(ps -p "$pid" -o command= 2>/dev/null || true)
      [[ -z "$cmd" ]] && continue
      if ! echo "$cmd" | grep -qF "$ROOT"; then
        continue
      fi
    fi
    # 杀进程组，确保 tsx/next 的子进程一并退出
    local pgid
    pgid=$(ps -p "$pid" -o pgid= 2>/dev/null | tr -d ' ')
    if [[ -n "$pgid" && "$pgid" != "-" ]]; then
      kill -TERM -"$pgid" 2>/dev/null && found=1
    else
      kill "$pid" 2>/dev/null && found=1
    fi
  done
  if [[ $found -eq 1 ]]; then
    echo "✅ 已停止 $label"
  else
    echo "未发现本项目 $label 进程"
  fi
}

# 后端：tsx watch src/index.ts（api 包独有命令），且路径含项目根
stop_by_pattern "tsx watch src/index.ts" "后端" "true"

# 前端：next dev，且进程路径含项目根（避免误杀其他项目）
stop_by_pattern "next dev" "前端" "true"
