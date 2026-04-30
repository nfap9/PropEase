#!/bin/bash
# ============================================
# PropEase 生产环境部署脚本
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${ENV_FILE:-$PROJECT_ROOT/docker/.env.production}"

usage() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --skip-build    跳过镜像构建，仅重启服务"
    echo "  --api-only      仅构建并部署 API"
    echo "  --web-only      仅构建并部署前端"
    echo "  -h, --help      显示帮助"
    echo ""
    echo "环境变量:"
    echo "  ENV_FILE        环境变量文件路径（默认: .env.production）"
}

# 解析参数
SKIP_BUILD=false
API_ONLY=false
WEB_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build) SKIP_BUILD=true; shift ;;
        --api-only) API_ONLY=true; shift ;;
        --web-only) WEB_ONLY=true; shift ;;
        -h|--help) usage; exit 0 ;;
        *) echo "未知选项: $1"; usage; exit 1 ;;
    esac
done

cd "$PROJECT_ROOT"

# 检查环境变量文件
if [[ ! -f "$ENV_FILE" ]]; then
    echo "错误: 环境变量文件不存在: $ENV_FILE"
    echo "请复制并编辑: cp docker/.env.production.example docker/.env.production"
    exit 1
fi

echo "============================================"
echo "  PropEase 部署"
echo "============================================"
echo "环境变量: $ENV_FILE"
echo ""

# 加载环境变量
set -a
source "$ENV_FILE"
set +a

# 停止现有服务
echo ">>> 停止现有服务..."
docker compose -p propease-prod -f docker/docker-compose.yaml down --remove-orphans 2>/dev/null || true

# 构建镜像
if [[ "$SKIP_BUILD" == "false" ]]; then
    if [[ "$API_ONLY" == "false" ]]; then
        echo ""
        echo ">>> 构建前端镜像..."
        docker build -t propease-web:${WEB_IMAGE_TAG:-latest} -f docker/Dockerfile.web .
    fi

    if [[ "$WEB_ONLY" == "false" ]]; then
        echo ""
        echo ">>> 构建 API 镜像..."
        docker build -t propease-api:${API_IMAGE_TAG:-latest} -f api/Dockerfile .
    fi
else
    echo ""
    echo ">>> 跳过镜像构建（--skip-build）"
fi

# 启动服务
echo ""
echo ">>> 启动服务..."
docker compose -p propease-prod -f docker/docker-compose.yaml --env-file "$ENV_FILE" up -d

# 等待 API 健康检查
echo ""
echo ">>> 等待服务启动..."
sleep 5

# 验证
if curl -sf "http://localhost/api/v1/health" > /dev/null 2>&1; then
    echo ""
    echo "============================================"
    echo "  部署成功"
    echo "============================================"
    echo "访问地址:"
    echo "  租客端: http://localhost/tenant"
    echo "  管理后台: http://localhost/admin"
    echo "  API: http://localhost/api/v1"
else
    echo ""
    echo "警告: API 健康检查未通过，请检查日志:"
    echo "  docker compose -p propease-prod -f docker/docker-compose.yaml logs api"
fi
