#!/bin/bash
# =========================================
# 本地构建 Docker 镜像
# =========================================
# 使用方法: ./scripts/build-local.sh [选项]
#   --push    构建后推送到服务器
#   --save    保存为 tar 文件（默认）
#
# 环境变量配置:
#   DEPLOY_USER      - 服务器用户名 (默认: root)
#   DEPLOY_HOST      - 服务器 IP 或域名
#   DEPLOY_API_URL   - API 地址 (默认从 .env.production 读取)
# =========================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 配置
IMAGE_API="apartment-ultra_api"
IMAGE_WEB="apartment-ultra_web"
TAG="${1:-latest}"
SERVER_USER="${DEPLOY_USER:-root}"
SERVER_HOST="${DEPLOY_HOST:-}"

log_info "开始构建 Docker 镜像..."

# 构建参数：指定平台为 linux/amd64（适配云服务器）
BUILD_ARGS="--platform linux/amd64"

# 构建 API 镜像
log_info "构建 API 镜像..."
docker build ${BUILD_ARGS} -f api/Dockerfile -t ${IMAGE_API}:${TAG} .

# 构建 Web 镜像（需要传入构建参数）
log_info "构建 Web 镜像..."
# 优先级: DEPLOY_API_URL > .env.production > 报错
if [ -n "$DEPLOY_API_URL" ]; then
    API_URL="$DEPLOY_API_URL"
elif [ -f ".env.production" ]; then
    API_URL=$(grep "^NEXT_PUBLIC_API_URL=" .env.production | cut -d'=' -f2-)
    if [ -z "$API_URL" ]; then
        log_error ".env.production 中未找到 NEXT_PUBLIC_API_URL"
        exit 1
    fi
else
    log_error "请设置 DEPLOY_API_URL 环境变量或创建 .env.production 文件"
    log_info "示例: DEPLOY_API_URL=http://your-server/api/v1 ./scripts/build-local.sh"
    exit 1
fi
log_info "API URL: ${API_URL}"
docker build ${BUILD_ARGS} -f web/Dockerfile.prod --build-arg NEXT_PUBLIC_API_URL=${API_URL} -t ${IMAGE_WEB}:${TAG} .

log_info "构建完成!"

# 保存镜像
log_info "保存镜像到 tar 文件..."
mkdir -p dist
docker save ${IMAGE_API}:${TAG} | gzip > dist/api.tar.gz
docker save ${IMAGE_WEB}:${TAG} | gzip > dist/web.tar.gz

log_info "镜像已保存到 dist/ 目录"
ls -lh dist/

echo ""
echo "=========================================="
echo "后续步骤:"
echo ""
if [ -n "$SERVER_HOST" ]; then
    echo "1. 上传镜像到服务器:"
    echo "   scp dist/*.tar.gz ${SERVER_USER}@${SERVER_HOST}:/tmp/"
    echo ""
    echo "2. 在服务器加载镜像并启动:"
    echo "   ssh ${SERVER_USER}@${SERVER_HOST}"
else
    echo "1. 上传镜像到服务器 (设置 DEPLOY_HOST 以自动填充地址):"
    echo "   scp dist/*.tar.gz <user>@<host>:/tmp/"
    echo ""
    echo "2. 在服务器加载镜像并启动:"
    echo "   ssh <user>@<host>"
fi
echo "   cd /opt/apartment-ultra"
echo "   docker load < /tmp/api.tar.gz"
echo "   docker load < /tmp/web.tar.gz"
echo "   docker compose -f docker/docker-compose.prod.yaml --env-file .env.production up -d"
echo "=========================================="
