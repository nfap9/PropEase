import express, { type Express } from 'express';
import cors from 'cors';
import { config } from './config.js';
import { responseWrapper } from './middlewares/responseWrapper.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { healthHandler } from './routes/health.js';
import { v1Router } from './routes/v1/index.js';
import { seedAdminSuper } from './startup/seedAdmin.js';
import { seedE2EUser } from './startup/seedE2E.js';
import { seedPermissions } from './startup/seedPermissions.js';
import { seedPlans } from './startup/seedPlans.js';
import { seedUsagePricing } from './startup/seedUsagePricing.js';
import { seedPlatformConfig } from './startup/seedPlatformConfig.js';
import { startScheduler } from './scheduler/index.js';

const app: Express = express();

app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json());
app.use(responseWrapper);

app.get('/health', healthHandler);
app.use(config.apiV1Prefix, v1Router);

app.use(errorHandler);

const port = Number(process.env.PORT) || 8000;

async function start(): Promise<void> {
  try {
    await seedAdminSuper();
  } catch (e) {
    console.error('Startup seed failed:', e);
  }
  try {
    await seedPermissions();
  } catch (e) {
    console.error('Permission seed failed:', e);
  }
  try {
    await seedPlans();
  } catch (e) {
    console.error('Plan seed failed:', e);
  }
  try {
    await seedUsagePricing();
  } catch (e) {
    console.error('Usage pricing seed failed:', e);
  }
  try {
    await seedPlatformConfig();
  } catch (e) {
    console.error('Platform config seed failed:', e);
  }
  if (process.env.SEED_E2E_USER === 'true') {
    try {
      await seedE2EUser();
    } catch (e) {
      console.error('E2E seed failed:', e);
    }
  }
  startScheduler();

  app.listen(port, '0.0.0.0', () => {
    console.log(`${config.appName} listening on port ${port}`);
  });
}

start();

export default app;
