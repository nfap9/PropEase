# 构建上下文为 monorepo 根目录
FROM node:20-alpine

WORKDIR /app

# 复制 workspace 根与各包（含 api-contract），使用单一 lockfile 安装
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY api/package.json api/package.json
COPY web/package.json web/package.json
COPY packages/ packages/
RUN corepack enable pnpm && pnpm install --frozen-lockfile

COPY web/ web/

WORKDIR /app
EXPOSE 3000
CMD ["pnpm", "--filter", "frontend", "dev"]
