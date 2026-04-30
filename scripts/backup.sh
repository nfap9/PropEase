#!/bin/bash
# ============================================
# PropEase 数据库备份脚本
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.production"
BACKUP_DIR="$PROJECT_ROOT/docker/backup"

echo "============================================"
echo "  PropEase 数据库备份"
echo "============================================"
echo ""

# 加载环境变量
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
else
    echo "错误: 未找到环境变量文件: $ENV_FILE"
    exit 1
fi

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 生成备份文件名
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/postgres_backup_${TIMESTAMP}.sql.gz"

echo "备份目标: $BACKUP_FILE"
echo ""

# 检查 PostgreSQL 容器是否运行
if ! docker ps | grep -q "apartment_ultra_db"; then
    echo "错误: PostgreSQL 容器未运行"
    echo "请先启动服务: docker compose -f docker/docker-compose.yaml up -d postgres"
    exit 1
fi

# 执行备份
echo "开始备份数据库..."
docker exec apartment_ultra_db pg_dump -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-apartment_ultra}" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo ""
    echo "✓ 备份成功!"
    echo "  文件: $BACKUP_FILE"
    echo "  大小: $BACKUP_SIZE"
else
    echo ""
    echo "✗ 备份失败!"
    exit 1
fi

# 清理旧备份（保留最近 7 天）
echo ""
echo "清理旧备份（保留最近 7 天）..."
find "$BACKUP_DIR" -name "postgres_backup_*.sql.gz" -mtime +7 -delete
REMAINING=$(find "$BACKUP_DIR" -name "postgres_backup_*.sql.gz" | wc -l)
echo "  保留备份数量: $REMAINING"

echo ""
echo "============================================"
echo "  备份完成!"
echo "============================================"
