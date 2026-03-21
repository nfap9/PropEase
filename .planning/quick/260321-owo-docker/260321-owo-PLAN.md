---
phase: quick
plan: "01"
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true
requirements: []
user_setup:
  - service: docker
    why: "容器化部署"
    env_vars: []
    dashboard_config: []
---

<objective>
在本地通过 Docker 部署 Apartment Ultra 项目

Purpose: 启动完整开发环境（前后端 + 中间件）
Output: 本地运行的 Docker 容器服务
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@docker/README.md
@docker/docker-compose.dev.yaml
@docker/.env.dev
</context>

<tasks>

<task type="auto">
  <name>Task 1: 启动完整 Docker 开发环境</name>
  <files>docker/docker-compose.dev.yaml</files>
  <action>
    1. 确保没有端口冲突（5432 PostgreSQL, 6379 Redis, 8000 API, 3000 tenant-web, 3001 admin-web）

    2. 在仓库根目录执行以下命令启动完整开发环境：
    ```bash
    docker compose -p apartment-ultra-dev -f docker/docker-compose.dev.yaml --env-file docker/.env.dev up -d --build
    ```

    3. 首次启动会构建镜像并安装依赖，请耐心等待（约3-5分钟）

    4. 等待所有服务健康启动后，验证服务是否正常：
    - API: curl http://localhost:8000/health
    - 租客端: curl http://localhost:3000
    - 运营后台: curl http://localhost:3001
  </action>
  <verify>
    <automated>docker compose -p apartment-ultra-dev -f docker/docker-compose.dev.yaml ps</automated>
  </verify>
  <done>所有容器状态为 running/healthy，API /health 返回 200</done>
</task>

</tasks>

<verification>
- `docker compose -p apartment-ultra-dev -f docker/docker-compose.dev.yaml ps` 显示所有服务 UP
- `curl http://localhost:8000/health` 返回 200
- `curl http://localhost:3000` 返回 HTML（Next.js 首页）
- `curl http://localhost:3001` 返回 HTML（Admin Next.js 首页）
</verification>

<success_criteria>
- PostgreSQL 容器正常运行
- Redis 容器正常运行
- API 服务在 8000 端口可访问
- tenant-web 在 3000 端口可访问
- admin-web 在 3001 端口可访问
</success_criteria>

<output>
After completion, create `.planning/quick/260321-owo-docker/260321-owo-SUMMARY.md`
</output>
