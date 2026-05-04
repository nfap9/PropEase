// 可观测性初始化必须在最顶部
import { initObservability } from './observability/index.js';
initObservability();

import { logger } from './utils/logger.js';

import express, { type Express } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { config } from './config.js';
import { responseWrapper } from './middlewares/responseWrapper.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { healthHandler } from './routes/health.js';
import { v1Router } from './routes/v1/index.js';
import { waitForDatabase, verifyDatabaseSchema } from './startup/dbCheck.js';
import { startScheduler } from './scheduler/index.js';
import { swaggerSpec } from './swagger.js';

const app: Express = express();

app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json());
app.use(responseWrapper);

app.get('/health', healthHandler);

// Swagger UI - API 文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'PropEase API Docs',
}));

// OpenAPI JSON
// app.get('/openapi.json', (_req, res) => {
//   res.setHeader('Content-Type', 'application/json');
//   res.send(swaggerSpec);
// });

app.use(config.apiV1Prefix, v1Router);

app.use(errorHandler);

const port = Number(process.env.PORT) || 8000;

async function start(): Promise<void> {
  // 1. 等待数据库连接
  const dbCheck = await waitForDatabase();
  if (!dbCheck.connected) {
    logger.error({ err: 'database_connection_failed' }, '无法连接数据库，退出...');
    process.exit(1);
  }

  // 2. 验证数据库 schema（可选，生产环境可跳过）
  if (config.isDev) {
    const schemaValid = await verifyDatabaseSchema();
    if (!schemaValid) {
      logger.error({ err: 'database_schema_invalid' }, '数据库 schema 不完整，请运行 prisma db push');
      process.exit(1);
    }
  }

  // 3. 启动定时任务
  startScheduler();

  app.listen(port, '0.0.0.0', () => {
    logger.info({ port, service: config.appName }, '服务启动');
  });
}

start();

export default app;
