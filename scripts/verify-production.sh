#!/bin/bash
# ============================================
# Apartment Ultra 生产环境验证脚本
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.production"

echo "============================================"
echo "  Apartment Ultra 生产环境验证"
echo "============================================"
echo ""

# 加载环境变量
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
fi

# 容器状态检查
echo "1. 容器状态检查"
echo "--------------------------------------------"
CONTAINERS=(
    "apartment_ultra_db"
    "apartment_ultra_redis"
    "apartment_ultra_api"
    "apartment_ultra_tenant_web"
    "apartment_ultra_admin"
    "apartment_ultra_nginx"
)

ALL_RUNNING=true
for container in "${CONTAINERS[@]}"; do
    if docker ps | grep -q "$container"; then
        STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no-health-check")
        if [ "$STATUS" = "healthy" ] || [ "$STATUS" = "no-health-check" ]; then
            echo "   ✓ $container: 运行中"
        else
            echo "   ⚠ $container: $STATUS"
        fi
    else
        echo "   ✗ $container: 未运行"
        ALL_RUNNING=false
    fi
done

echo ""

# API 健康检查
echo "2. API 健康检查"
echo "--------------------------------------------"
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
if [ "$API_HEALTH" = "200" ]; then
    echo "   ✓ API 健康检查通过"
else
    echo "   ✗ API 健康检查失败 (HTTP $API_HEALTH)"
fi

# API 版本检查
echo ""
echo "3. API 版本信息"
echo "--------------------------------------------"
API_VERSION=$(curl -s http://localhost:8000/health 2>/dev/null | grep -o '"version":"[^"]*"' | cut -d'"' -f4 || echo "未知")
echo "   版本: $API_VERSION"

# 租客端检查
echo ""
echo "4. 租客端检查"
echo "--------------------------------------------"
TENANT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$TENANT_STATUS" = "200" ]; then
    echo "   ✓ 租客端可访问 (HTTP $TENANT_STATUS)"
else
    echo "   ✗ 租客端不可用 (HTTP $TENANT_STATUS)"
fi

# 运营后台检查
echo ""
echo "5. 运营后台检查"
echo "--------------------------------------------"
ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null || echo "000")
if [ "$ADMIN_STATUS" = "200" ]; then
    echo "   ✓ 运营后台可访问 (HTTP $ADMIN_STATUS)"
else
    echo "   ✗ 运营后台不可用 (HTTP $ADMIN_STATUS)"
fi

# Nginx 代理检查
echo ""
echo "6. Nginx 代理检查"
echo "--------------------------------------------"
NGINX_API=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health 2>/dev/null || echo "000")
NGINX_WEB=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
NGINX_ADMIN=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/admin 2>/dev/null || echo "000")

if [ "$NGINX_API" = "200" ]; then
    echo "   ✓ API 代理正常 (HTTP $NGINX_API)"
else
    echo "   ✗ API 代理异常 (HTTP $NGINX_API)"
fi

if [ "$NGINX_WEB" = "200" ]; then
    echo "   ✓ 前端代理正常 (HTTP $NGINX_WEB)"
else
    echo "   ✗ 前端代理异常 (HTTP $NGINX_WEB)"
fi

if [ "$NGINX_ADMIN" = "200" ]; then
    echo "   ✓ 运营后台代理正常 (HTTP $NGINX_ADMIN)"
else
    echo "   ✗ 运营后台代理异常 (HTTP $NGINX_ADMIN)"
fi

# 数据库连接检查
echo ""
echo "7. 数据库连接检查"
echo "--------------------------------------------"
if docker exec apartment_ultra_db pg_isready -U "${POSTGRES_USER:-postgres}" > /dev/null 2>&1; then
    echo "   ✓ PostgreSQL 连接正常"
else
    echo "   ✗ PostgreSQL 连接异常"
fi

# Redis 连接检查
echo ""
echo "8. Redis 连接检查"
echo "--------------------------------------------"
if docker exec apartment_ultra_redis redis-cli ping > /dev/null 2>&1; then
    echo "   ✓ Redis 连接正常"
else
    echo "   ✗ Redis 连接异常"
fi

# 日志检查（最近错误）
echo ""
echo "9. 容器日志检查（最近错误）"
echo "--------------------------------------------"
ERRORS=$(docker compose -f "$PROJECT_ROOT/docker/docker-compose.yaml" logs --tail=50 --since=10m 2>/dev/null | grep -i "error\|fatal\|exception" | tail -5 || true)
if [ -n "$ERRORS" ]; then
    echo "   ⚠ 检测到潜在错误:"
    echo "$ERRORS" | sed 's/^/      /'
else
    echo "   ✓ 最近 10 分钟无明显错误"
fi

echo ""
echo "============================================"
echo "  验证完成!"
echo "============================================"
echo ""
echo "访问地址:"
echo "  租客端:   http://${SERVER_NAME:-localhost}"
echo "  运营后台: http://${SERVER_NAME:-localhost}/admin"
echo "  API:      http://${SERVER_NAME:-localhost}/api/v1"
echo ""
