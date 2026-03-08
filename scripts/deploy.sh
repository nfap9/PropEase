#!/bin/bash
# =========================================
# Apartment Ultra 部署脚本
# =========================================
# 使用方法: ./scripts/deploy.sh [命令]
# 命令:
#   start     - 首次部署
#   update    - 更新部署
#   stop      - 停止服务
#   logs      - 查看日志
#   status    - 查看状态
# =========================================

set -e

# 配置
PROJECT_DIR="/opt/apartment-ultra"
COMPOSE_FILE="docker/docker-compose.prod.yaml"
ENV_FILE=".env.production"

cd $PROJECT_DIR

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查环境变量文件
check_env() {
    if [ ! -f "$ENV_FILE" ]; then
        log_error "环境变量文件 $ENV_FILE 不存在"
        log_info "请复制模板并配置: cp docker/.env.production.example .env.production"
        exit 1
    fi
}

# 首次部署
deploy_start() {
    log_info "开始首次部署..."

    check_env

    log_info "构建 Docker 镜像..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE build

    log_info "启动服务..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d

    log_info "等待服务启动..."
    sleep 10

    log_info "检查服务状态..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE ps

    log_info "部署完成!"
    log_info "前端访问地址: http://120.79.41.29"
    log_info "API 访问地址: http://120.79.41.29/api/v1"
}

# 更新部署
deploy_update() {
    log_info "开始更新部署..."

    check_env

    log_info "拉取最新代码..."
    git pull origin main

    log_info "重新构建镜像..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE build

    log_info "重启服务..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d --no-deps api web

    log_info "清理旧镜像..."
    docker image prune -f

    log_info "检查服务状态..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE ps

    log_info "更新完成!"
}

# 停止服务
deploy_stop() {
    log_info "停止服务..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE down
    log_info "服务已停止"
}

# 查看日志
deploy_logs() {
    local service=$1
    if [ -z "$service" ]; then
        docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f --tail=100
    else
        docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f --tail=100 $service
    fi
}

# 查看状态
deploy_status() {
    log_info "服务状态:"
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE ps

    echo ""
    log_info "健康检查:"
    curl -s http://localhost:8000/api/v1/health || log_warn "API 服务未响应"
    echo ""
}

# 主命令
case "$1" in
    start)
        deploy_start
        ;;
    update)
        deploy_update
        ;;
    stop)
        deploy_stop
        ;;
    logs)
        deploy_logs $2
        ;;
    status)
        deploy_status
        ;;
    *)
        echo "使用方法: $0 {start|update|stop|logs [service]|status}"
        echo ""
        echo "命令说明:"
        echo "  start       - 首次部署"
        echo "  update      - 更新部署（拉取代码并重启）"
        echo "  stop        - 停止服务"
        echo "  logs [svc]  - 查看日志（可指定服务：api/web/postgres/redis）"
        echo "  status      - 查看服务状态"
        exit 1
        ;;
esac
