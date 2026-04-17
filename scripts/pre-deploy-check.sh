#!/bin/bash
# ============================================
# Apartment Ultra 部署前检查脚本
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.production"

echo "============================================"
echo "  部署前检查"
echo "============================================"
echo ""

ERRORS=0

# 检查环境变量文件
echo "1. 检查环境变量文件..."
if [ -f "$ENV_FILE" ]; then
    echo "   ✓ 环境变量文件存在: $ENV_FILE"

    # 检查必填项
    source "$ENV_FILE"

    REQUIRED_VARS=(
        "SECRET_KEY"
        "POSTGRES_PASSWORD"
        "CORS_ORIGINS"
        "VITE_API_URL"
        "SERVER_NAME"
    )

    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ] || [ "${!var}" == "your-jwt-secret-key" ] || [ "${!var}" == "your-secure-password" ] || [ "${!var}" == "your-domain.com" ]; then
            echo "   ✗ 必填项未设置或为默认值: $var"
            ERRORS=$((ERRORS + 1))
        else
            echo "   ✓ $var 已设置"
        fi
    done
else
    echo "   ✗ 环境变量文件不存在: $ENV_FILE"
    echo "     请先运行: ./scripts/setup-env.sh"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# 检查 Docker
echo "2. 检查 Docker..."
if docker info > /dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | tr -d ',')
    echo "   ✓ Docker 已安装: $DOCKER_VERSION"
else
    echo "   ✗ Docker 未运行或当前用户没有权限"
    ERRORS=$((ERRORS + 1))
fi

# 检查 Docker Compose
echo ""
echo "3. 检查 Docker Compose..."
if docker compose version > /dev/null 2>&1; then
    COMPOSE_VERSION=$(docker compose version | awk '{print $4}' | tr -d ',')
    echo "   ✓ Docker Compose 已安装: $COMPOSE_VERSION"
else
    echo "   ✗ Docker Compose 未安装"
    ERRORS=$((ERRORS + 1))
fi

# 检查端口占用
echo ""
echo "4. 检查端口占用..."
PORTS=(80 5432 6379)
for PORT in "${PORTS[@]}"; do
    if lsof -i :$PORT > /dev/null 2>&1; then
        echo "   ⚠ 端口 $PORT 已被占用"
    else
        echo "   ✓ 端口 $PORT 可用"
    fi
done

# 检查磁盘空间
echo ""
echo "5. 检查磁盘空间..."
AVAILABLE=$(df -h . | awk 'NR==2 {print $4}')
if [ "${AVAILABLE%s}" -lt 5 ]; then
    echo "   ✗ 磁盘空间不足，建议至少 5GB 可用空间"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✓ 可用空间: $AVAILABLE"
fi

# 检查必要文件
echo ""
echo "6. 检查必要文件..."
DOCKER_FILES=(
    "docker/docker-compose.yaml"
    "docker/nginx.conf.template"
    "api/Dockerfile"
    "tenant-web/Dockerfile"
    "admin-web/Dockerfile"
)

for file in "${DOCKER_FILES[@]}"; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
        echo "   ✓ $file 存在"
    else
        echo "   ✗ $file 不存在"
        ERRORS=$((ERRORS + 1))
    fi
done

# 检查内存（Docker 建议至少 2GB）
echo ""
echo "7. 检查可用内存..."
TOTAL_MEM=$(free -m | awk 'NR==2 {print $2}')
if [ "$TOTAL_MEM" -lt 2048 ]; then
    echo "   ⚠ 内存较低 ($TOTAL_MEM MB)，建议至少 2GB"
else
    echo "   ✓ 可用内存: ${TOTAL_MEM}MB"
fi

echo ""
echo "============================================"
if [ $ERRORS -eq 0 ]; then
    echo "  检查通过! 可以继续部署。"
    echo "============================================"
    exit 0
else
    echo "  检查未通过，发现 $ERRORS 个错误。"
    echo "  请修复上述问题后重试。"
    echo "============================================"
    exit 1
fi
