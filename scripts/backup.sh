#!/bin/bash
# =========================================
# Apartment Ultra 数据库备份脚本
# =========================================
# 使用方法: ./scripts/backup.sh
# 建议配置 crontab 定时执行:
#   0 2 * * * /opt/apartment-ultra/scripts/backup.sh >> /var/log/apartment-backup.log 2>&1
# =========================================

set -e

# 配置
PROJECT_DIR="/opt/apartment-ultra"
COMPOSE_FILE="docker/docker-compose.server.yaml"
BACKUP_DIR="/opt/apartment-ultra/docker/backup"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/apartment_ultra_${DATE}.sql"
RETENTION_DAYS=7

# 颜色输出
GREEN='\033[0;32m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# 创建备份目录
mkdir -p $BACKUP_DIR

log_info "开始备份数据库..."

# 执行备份
cd $PROJECT_DIR
docker compose -f $COMPOSE_FILE exec -T postgres \
    pg_dump -U postgres apartment_ultra > $BACKUP_FILE

# 压缩备份
gzip $BACKUP_FILE

log_info "备份完成: ${BACKUP_FILE}.gz"
log_info "备份大小: $(du -h ${BACKUP_FILE}.gz | cut -f1)"

# 清理旧备份
log_info "清理 ${RETENTION_DAYS} 天前的备份..."
find $BACKUP_DIR -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete

# 显示当前备份列表
log_info "当前备份列表:"
ls -lh $BACKUP_DIR/*.sql.gz 2>/dev/null | tail -5 || echo "暂无备份文件"
