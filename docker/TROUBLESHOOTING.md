# 部署问题排查

## 常见问题快速索引

| 问题 | 症状 |
|------|------|
| [镜像拉取超时](#镜像拉取超时) | 拉取 Docker 镜像失败 |
| [502 Bad Gateway](#502-bad-gateway) | Nginx 返回 502 |
| [健康检查失败](#健康检查失败) | 容器显示 unhealthy |
| [数据库认证失败](#数据库认证失败) | password authentication failed |
| [数据库表不存在](#数据库表不存在) | TableDoesNotExist |
| [测试账号无法登录](#测试账号无法登录) | 本地或测试环境登录失败 |

---

## 镜像拉取超时

**解决方案**: 配置 Docker 镜像加速

```bash
# 编辑 /etc/docker/daemon.json
{
  "registry-mirrors": ["https://docker.1ms.run"]
}

# 重启 Docker
sudo systemctl restart docker
```

---

## 502 Bad Gateway

**排查步骤**:

```bash
# 1. 检查服务状态
docker compose -f docker/docker-compose.yaml --env-file .env.production ps

# 2. 查看 API 日志
docker compose -f docker/docker-compose.yaml --env-file .env.production logs api --tail 50
```

---

## 健康检查失败

**症状**: 容器状态显示 `unhealthy`

**排查**:

```bash
# 查看健康检查结果
docker inspect apartment_ultra_api --format='{{json .State.Health}}' | jq .

# 手动测试
docker exec apartment_ultra_api wget -q -O- http://127.0.0.1:8000/health
```

**常见原因**:
- 数据库未启动
- IPv6 问题：`localhost` 解析到 IPv6
- 数据库表不存在

---

## 数据库认证失败

**症状**: `password authentication failed for user "apartment_admin"`

**解决方案**:

```bash
# 1. 检查认证方式
docker exec apartment_ultra_db cat /var/lib/postgresql/data/pg_hba.conf | grep -v "^#" | grep -v "^$"

# 2. 修改为 md5（如使用 scram-sha-256）
docker exec apartment_ultra_db sed -i 's/scram-sha-256/md5/' /var/lib/postgresql/data/pg_hba.conf
docker restart apartment_ultra_db

# 3. 重置密码
docker exec apartment_ultra_db psql -U apartment_admin -d apartment_ultra -c "ALTER USER apartment_admin WITH PASSWORD 'your-password';"
```

---

## 数据库表不存在

**症状**: `TableDoesNotExist` 错误

**解决方案**:

```bash
# 运行迁移
docker exec apartment_ultra_api npx prisma db push

# 重启
docker restart apartment_ultra_api
```

---

## 测试账号无法登录

**症状**: 本地或测试环境中，测试账号无法正常登录

**解决方案**:

```bash
# 1. 检查 API 是否启动
docker compose -f docker/docker-compose.yaml --env-file .env.production logs api --tail 50

# 2. 检查数据库中是否存在测试用户
docker exec apartment_ultra_db psql -U apartment_admin -d apartment_ultra -c "select phone, is_active from users limit 20;"

# 3. 如需重新准备测试用户，使用应用当前支持的注册/初始化流程，而不是短信验证码流程
```

---

## 健康检查端点

API 服务有多个健康检查端点：

| 端点 | 说明 |
|------|------|
| `http://localhost:8000/health` | API 直接访问（不经过 Nginx） |
| `http://localhost/health` | 通过 Nginx 代理 |
| `http://localhost/api/v1/health` | 通过 Nginx 代理的 API 路径 |

```bash
# API 直接访问
curl -s http://localhost:8000/health

# 通过 Nginx 访问
curl -s http://localhost/api/v1/health
```

正常响应:
```json
{
  "status": "healthy",
  "app": "Apartment Ultra API",
  "version": "0.1.0",
  "is_dev": false,
  "checks": {
    "database": { "status": "ok", "latency": 5 }
  }
}
```

---

## pnpm 全局安装问题

**症状**: 前端镜像构建失败，错误信息 `ERR_PNPM_NO_GLOBAL_BIN_DIR`

**解决方案**: 已修复，Dockerfile 中改用 npm 安装 serve

---

## API 路径代理问题

**症状**: Nginx 返回 `404 Not Found`，但 API 直接访问正常

**原因**: Nginx 代理路径配置与 API 路由不匹配

API 的路由前缀是 `/api/v1`，但健康检查在 `/health`（不在 `/api/v1/health`）

**已修复**: nginx.conf.template 中已添加 `/api/v1/health` 的特殊处理

---

## 日志命令

```bash
# API 日志
docker logs -f apartment_ultra_api

# Nginx 日志
docker logs -f apartment_ultra_nginx

# 审计日志
docker logs -f apartment_ultra_api 2>&1 | grep AUDIT

# 所有服务日志
docker compose -f docker/docker-compose.yaml logs -f

# 查看最近错误
docker compose -f docker/docker-compose.yaml logs --tail 100 --since 10m | grep -i error
```
