import type { Request, Response } from 'express';
import { config } from '../config.js';

export function healthHandler(_req: Request, res: Response): void {
  res.json({
    status: 'healthy',
    app: config.appName,
    version: '0.1.0',
    is_dev: config.isDev,
  });
}
