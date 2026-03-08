# Build stage（构建上下文为 monorepo 根目录）
FROM node:20-alpine AS builder

WORKDIR /app

# 配置 pnpm 使用国内镜像
RUN corepack enable pnpm && pnpm config set registry https://registry.npmmirror.com

# 复制 workspace 根与各包（含 api-contract），使用单一 lockfile 安装
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY api/package.json api/package.json
COPY web/package.json web/package.json
COPY packages/ packages/
RUN pnpm install --frozen-lockfile

# 复制 api 源码
COPY api/ api/
# 先构建 api-contract（api 依赖其 dist），再生成 Prisma 并构建 api
RUN pnpm --filter @apartment-ultra/api-contract run build
# 设置构建时的 DATABASE_URL（prisma generate 不需要实际连接）
ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder"
RUN pnpm --filter apartment-ultra-api exec prisma generate
RUN pnpm --filter apartment-ultra-api run build

# Production stage（复制整棵 /app 以保持 pnpm node_modules 符号链接）
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# 复制构建产物
COPY --from=builder /app ./

WORKDIR /app/api

# 重新生成 Prisma 客户端（确保在运行时可用）
RUN npx prisma generate

EXPOSE 8000
CMD ["node", "dist/index.js"]
