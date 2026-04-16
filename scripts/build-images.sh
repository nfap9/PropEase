#!/bin/bash
# =========================================
# Apartment Ultra 构建所有 Docker 镜像
# =========================================
# 使用方法: ./scripts/build-images.sh [选项]
#   --tag VERSION    指定镜像标签 (默认: latest)
#   --save           保存为 tar 文件到 dist/
#   --push           推送到 Registry (需设置 REGISTRY)
#   --no-cache       禁用缓存完整重建
#
# 环境变量:
#   REGISTRY         - Docker Registry 地址 (默认: 无)
#   VITE_API_URL     - 前端 API 地址 (或从 .env.production 读取)
#   PLATFORM         - 目标平台 (默认: linux/amd64)
# =========================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
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

# 解析参数
TAG="latest"
SAVE_IMAGES=false
PUSH_IMAGES=false
NO_CACHE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --tag)
            TAG="$2"
            shift 2
            ;;
        --save)
            SAVE_IMAGES=true
            shift
            ;;
        --push)
            PUSH_IMAGES=true
            shift
            ;;
        --no-cache)
            NO_CACHE="--no-cache"
            shift
            ;;
        *)
            log_error "未知参数: $1"
            exit 1
            ;;
    esac
done

# 配置
REGISTRY="${REGISTRY:-}"
PLATFORM="${PLATFORM:-linux/amd64}"

# 镜像名称
IMAGE_API="apartment-ultra-api"
IMAGE_TENANT_WEB="apartment-ultra-tenant-web"
IMAGE_ADMIN_WEB="apartment-ultra-admin-web"

# 添加 Registry 前缀
if [ -n "$REGISTRY" ]; then
    IMAGE_API="${REGISTRY}/${IMAGE_API}"
    IMAGE_TENANT_WEB="${REGISTRY}/${IMAGE_TENANT_WEB}"
    IMAGE_ADMIN_WEB="${REGISTRY}/${IMAGE_ADMIN_WEB}"
fi

# 启用 BuildKit
export DOCKER_BUILDKIT=1

log_info "开始构建 Docker 镜像..."
echo -e "  ${CYAN}平台:${NC} ${PLATFORM}"
echo -e "  ${CYAN}标签:${NC} ${TAG}"
echo -e "  ${CYAN}镜像:${NC}"
echo -e "    - ${IMAGE_API}:${TAG}"
echo -e "    - ${IMAGE_TENANT_WEB}:${TAG}"
echo -e "    - ${IMAGE_ADMIN_WEB}:${TAG}"
echo ""

# 获取 API URL
if [ -z "$VITE_API_URL" ]; then
    if [ -f ".env.production" ]; then
        VITE_API_URL=$(grep "^VITE_API_URL=" .env.production | cut -d'=' -f2-)
    fi
fi

if [ -z "$VITE_API_URL" ] && ([ "$SAVE_IMAGES" = true ] || [ "$PUSH_IMAGES" = true ]); then
    log_warn "VITE_API_URL 未设置，前端镜像构建可能失败"
fi

# 预拉取基础镜像
log_info "预拉取基础镜像..."
docker pull --platform ${PLATFORM} node:20-alpine 2>/dev/null || true

# 构建 API 镜像
log_info "构建 API 镜像..."
docker buildx build \
    --platform ${PLATFORM} \
    --load \
    ${NO_CACHE} \
    -f api/Dockerfile \
    -t ${IMAGE_API}:${TAG} \
    .

# 构建租客端前端镜像
log_info "构建租客端前端镜像..."
docker buildx build \
    --platform ${PLATFORM} \
    --load \
    ${NO_CACHE} \
    --build-arg VITE_API_URL="${VITE_API_URL}" \
    -f tenant-web/Dockerfile \
    -t ${IMAGE_TENANT_WEB}:${TAG} \
    .

# 构建运营后台前端镜像
log_info "构建运营后台前端镜像..."
docker buildx build \
    --platform ${PLATFORM} \
    --load \
    ${NO_CACHE} \
    --build-arg VITE_API_URL="${VITE_API_URL}" \
    -f admin-web/Dockerfile \
    -t ${IMAGE_ADMIN_WEB}:${TAG} \
    .

log_info "构建完成!"

# 保存镜像
if [ "$SAVE_IMAGES" = true ]; then
    log_info "保存镜像到 dist/ 目录..."
    mkdir -p dist

    docker save ${IMAGE_API}:${TAG} | gzip > dist/api.tar.gz &
    docker save ${IMAGE_TENANT_WEB}:${TAG} | gzip > dist/tenant-web.tar.gz &
    docker save ${IMAGE_ADMIN_WEB}:${TAG} | gzip > dist/admin-web.tar.gz &
    wait

    log_info "镜像已保存:"
    ls -lh dist/*.tar.gz
fi

# 推送镜像
if [ "$PUSH_IMAGES" = true ]; then
    if [ -z "$REGISTRY" ]; then
        log_error "推送镜像需要设置 REGISTRY 环境变量"
        exit 1
    fi

    log_info "推送镜像到 ${REGISTRY}..."
    docker push ${IMAGE_API}:${TAG}
    docker push ${IMAGE_TENANT_WEB}:${TAG}
    docker push ${IMAGE_ADMIN_WEB}:${TAG}
    log_info "推送完成!"
fi

echo ""
echo "=========================================="
echo "构建摘要:"
echo "  API:         ${IMAGE_API}:${TAG}"
echo "  租客端:       ${IMAGE_TENANT_WEB}:${TAG}"
echo "  运营后台:     ${IMAGE_ADMIN_WEB}:${TAG}"
echo "=========================================="
