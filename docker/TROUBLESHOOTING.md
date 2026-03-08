# 部署问题排查

## 常见问题快速索引

| 问题 | 症状 |
|------|------|
| [镜像拉取超时](#镜像拉取超时) | 拉取 Docker 镜像失败 |
| [502 Bad Gateway](#502-bad-gateway) | Nginx 返回 502 |
| [健康检查失败](#健康检查失败) | 容器显示 unhealthy |
| [数据库认证失败](#数据库认证失败) | password authentication failed |
| [数据库表不存在](#数据库表不存在) | TableDoesNotExist |
| [验证码收不到](#验证码收不到) | 测试环境无法登录 |

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
docker compose -f docker/docker-compose.server.yaml --env-file .env.production ps

# 2. 查看 API 日志
docker compose -f docker/docker-compose.server.yaml --env-file .env.production logs api --tail 50
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

## 验证码收不到

**症状**: 测试环境登录时收不到验证码

**解决方案**:

```bash
# 1. 启用开发模式
echo "IS_DEV=true" >> .env.production

# 2. 重启 API
docker compose -f docker/docker-compose.server.yaml --env-file .env.production up -d --force-recreate api

# 3. 查看验证码
docker logs -f apartment_ultra_api 2>&1 | grep 验证码
```

---

## 健康检查端点

```bash
curl -s http://localhost:8000/health | jq .
```

正常响应:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "ok", "latency": 5 }
  }
}
```

---

## 日志命令

```bash
# API 日志
docker logs -f apartment_ultra_api

# 验证码
docker logs -f apartment_ultra_api 2>&1 | grep 验证码

# 审计日志
docker logs -f apartment_ultra_api 2>&1 | grep AUDIT
```
