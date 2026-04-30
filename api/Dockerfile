# Build stage（构建上下文为 monorepo 根目录）
FROM node:20-alpine AS builder

WORKDIR /app

# 配置 pnpm 使用国内镜像
RUN corepack enable pnpm && pnpm config set registry https://registry.npmmirror.com

# 复制 workspace 根与各包（含 api-contract），使用单一 lockfile 安装
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json tsconfig.base.json
COPY api/package.json api/package.json
COPY packages/ packages/
RUN pnpm install --no-frozen-lockfile

# 复制 api 源码（排除测试文件）
COPY api/src api/src
COPY api/prisma api/prisma
COPY api/prisma.config.ts api/
COPY api/tsconfig.json api/
COPY api/package.json api/
# 先构建 api-contract（api 依赖其 dist），再生成 Prisma 并构建 api
RUN pnpm --filter @propease/api-contract run build
# 设置构建时的 DATABASE_URL（prisma generate 不需要实际连接）
ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder"
RUN pnpm --filter propease-api exec prisma generate
RUN pnpm --filter propease-api run build

# Production stage（复制整棵 /app 以保持 pnpm node_modules 符号链接）
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# 复制构建产物（已在 builder 阶段完成 prisma generate 和 tsc build）
COPY --from=builder /app ./

EXPOSE 8000
CMD ["node", "dist/index.js"]
