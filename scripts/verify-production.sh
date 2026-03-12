#!/bin/bash
# ============================================
# 本地验证生产环境构建
# 用法: ./scripts/verify-production.sh [--cleanup]
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m'

CLEANUP=false
for arg in "$@"; do
    if [ "$arg" == "--cleanup" ]; then
        CLEANUP=true
    fi
done

echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}          ${1m本地生产环境验证${NC}                      ${CYAN}║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

ENV_FILE=".env.production"
COMPOSE_FILE="docker/docker-compose.yaml"

# 清理函数
cleanup() {
    echo ""
    echo -e "${DIM}▶ 清理环境...${NC}"
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE down --volumes 2>/dev/null || true
    echo -e "${GREEN}清理完成${NC}"
}

# 如果指定了 --cleanup 或按 Ctrl+C，执行清理
if [ "$CLEANUP" = true ]; then
    cleanup
    exit 0
fi

trap cleanup EXIT

# ============================================
# 1. 检查环境文件
# ============================================
echo -e "${DIM}▶ 检查环境配置${NC}"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "  ${YELLOW}!${NC} $ENV_FILE 不存在，创建测试配置..."
    cp docker/.env.production.example "$ENV_FILE"

    # 设置测试值
    sed -i '' "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -base64 24)|" "$ENV_FILE"
    sed -i '' "s|SECRET_KEY=.*|SECRET_KEY=$(openssl rand -hex 32)|" "$ENV_FILE"
    sed -i '' "s|CORS_ORIGINS=.*|CORS_ORIGINS=[\"http://localhost:3000\"]|" "$ENV_FILE"
    sed -i '' "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1|" "$ENV_FILE"
    sed -i '' "s|SERVER_NAME=.*|SERVER_NAME=localhost|" "$ENV_FILE"

    echo -e "  ${GREEN}✓${NC} 已创建测试环境配置"
else
    echo -e "  ${GREEN}✓${NC} 环境文件存在"
fi

# ============================================
# 2. 构建 Docker 镜像
# ============================================
echo ""
echo -e "${DIM}▶ 构建 Docker 镜像${NC}"
echo -e "  ${DIM}(这可能需要几分钟...)${NC}"

API_URL=$(grep "^NEXT_PUBLIC_API_URL=" "$ENV_FILE" | cut -d'=' -f2-)

# 构建 API 镜像
BUILD_LOG=$(mktemp)
if docker buildx build --load -f api/Dockerfile -t apartment-ultra-api:latest . >"$BUILD_LOG" 2>&1; then
    echo -e "  ${GREEN}✓${NC} API 镜像构建成功"
else
    echo -e "  ${RED}✗${NC} API 镜像构建失败"
    echo -e "  ${DIM}错误日志:${NC}"
    tail -30 "$BUILD_LOG" | sed 's/^/    /'
    rm -f "$BUILD_LOG"
    exit 1
fi
rm -f "$BUILD_LOG"

# 构建租客端前端镜像
BUILD_LOG=$(mktemp)
if docker buildx build --load -f tenant-web/Dockerfile.prod --build-arg NEXT_PUBLIC_API_URL="${API_URL}" -t apartment-ultra-tenant-web:latest . >"$BUILD_LOG" 2>&1; then
    echo -e "  ${GREEN}✓${NC} 租客端前端镜像构建成功"
else
    echo -e "  ${RED}✗${NC} 租客端前端镜像构建失败"
    echo -e "  ${DIM}错误日志:${NC}"
    tail -30 "$BUILD_LOG" | sed 's/^/    /'
    rm -f "$BUILD_LOG"
    exit 1
fi
rm -f "$BUILD_LOG"

# 构建运营后台前端镜像
BUILD_LOG=$(mktemp)
if docker buildx build --load -f admin-web/Dockerfile.prod --build-arg NEXT_PUBLIC_API_URL="${API_URL}" -t apartment-ultra-admin-web:latest . >"$BUILD_LOG" 2>&1; then
    echo -e "  ${GREEN}✓${NC} 运营后台前端镜像构建成功"
else
    echo -e "  ${RED}✗${NC} 运营后台前端镜像构建失败"
    echo -e "  ${DIM}错误日志:${NC}"
    tail -30 "$BUILD_LOG" | sed 's/^/    /'
    rm -f "$BUILD_LOG"
    exit 1
fi
rm -f "$BUILD_LOG"

# ============================================
# 3. 启动服务
# ============================================
echo ""
echo -e "${DIM}▶ 启动服务${NC}"

docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d --no-build

echo -e "  ${DIM}等待服务启动...${NC}"

# 等待 API 健康
MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
    if [ "$HEALTH" = "200" ]; then
        echo -e "  ${GREEN}✓${NC} API 服务已就绪"
        break
    fi
    echo -n "."
    sleep 2
    WAITED=$((WAITED + 2))
done
echo ""

if [ "$HEALTH" != "200" ]; then
    echo -e "  ${RED}✗${NC} API 服务启动超时"
    echo -e "  ${DIM}日志:${NC}"
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs api --tail 20 2>/dev/null | sed 's/^/    /'
    exit 1
fi

# ============================================
# 4. 健康检查
# ============================================
echo ""
echo -e "${DIM}▶ 健康检查${NC}"

# 检查 API
API_HEALTH=$(curl -s http://localhost:8000/health 2>/dev/null)
if echo "$API_HEALTH" | grep -q '"status":"healthy"'; then
    echo -e "  ${GREEN}✓${NC} API 健康检查通过"
    echo -e "  ${DIM}响应: $(echo "$API_HEALTH" | head -c 100)...${NC}"
else
    echo -e "  ${RED}✗${NC} API 健康检查失败"
    echo -e "  ${DIM}响应: $API_HEALTH${NC}"
fi

# 检查租客端前端
TENANT_WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$TENANT_WEB_STATUS" = "200" ]; then
    echo -e "  ${GREEN}✓${NC} 租客端前端服务响应正常"
else
    echo -e "  ${YELLOW}!${NC} 租客端前端服务状态码: $TENANT_WEB_STATUS"
fi

# 检查运营后台
ADMIN_WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/admin 2>/dev/null || echo "000")
if [ "$ADMIN_WEB_STATUS" = "200" ] || [ "$ADMIN_WEB_STATUS" = "302" ]; then
    echo -e "  ${GREEN}✓${NC} 运营后台服务响应正常"
else
    echo -e "  ${YELLOW}!${NC} 运营后台服务状态码: $ADMIN_WEB_STATUS"
fi

# 检查 Nginx
NGINX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/health 2>/dev/null || echo "000")
if [ "$NGINX_STATUS" = "200" ]; then
    echo -e "  ${GREEN}✓${NC} Nginx 代理正常"
else
    echo -e "  ${YELLOW}!${NC} Nginx 状态码: $NGINX_STATUS"
fi

# ============================================
# 5. API 功能测试
# ============================================
echo ""
echo -e "${DIM}▶ API 功能测试${NC}"

# 测试管理员登录
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/admin/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"Admin@123456"}' 2>/dev/null || echo '{"code":-1}')

if echo "$LOGIN_RESPONSE" | grep -q '"code":0'; then
    echo -e "  ${GREEN}✓${NC} 管理员登录成功"
else
    echo -e "  ${RED}✗${NC} 管理员登录失败"
    echo -e "  ${DIM}响应: $LOGIN_RESPONSE${NC}"
fi

# ============================================
# 6. 汇总
# ============================================
echo ""
echo -e "${DIM}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}本地验证完成！${NC}"
echo ""
echo -e "访问地址:"
echo -e "  ${CYAN}→${NC} 租客端: ${DIM}http://localhost:3000${NC}"
echo -e "  ${CYAN}→${NC} 运营后台: ${DIM}http://localhost:80/admin${NC}"
echo -e "  ${CYAN}→${NC} API:  ${DIM}http://localhost:8000/api/v1${NC}"
echo -e "  ${CYAN}→${NC} 健康检查: ${DIM}http://localhost:8000/health${NC}"
echo ""
echo -e "管理员账号: ${DIM}admin / Admin@123456${NC}"
echo ""
echo -e "查看日志: ${DIM}docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f${NC}"
echo -e "停止服务: ${DIM}./scripts/verify-production.sh --cleanup${NC}"
echo ""

# 不自动退出，保持容器运行
trap - EXIT
