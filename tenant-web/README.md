# Tenant Web

租客端 Web 应用，基于 Next.js 14 构建，承载租客/二房东日常使用的业务界面。

## 本地开发

先在仓库根目录安装依赖：

```bash
pnpm install
```

然后启动租客端开发服务器：

```bash
pnpm dev
```

默认地址为 [http://localhost:3000](http://localhost:3000)。

如果需要完整联调，建议同时在仓库根目录启动：

```bash
pnpm dev:api
pnpm dev:admin
```

## 常用命令

```bash
pnpm dev
pnpm build
pnpm type-check
pnpm test:run
```

## 相关文档

- [租客端开发指南](./AGENTS.md)
- [仓库总览](../README.md)
- [E2E 测试指南](../e2e/AGENTS.md)
