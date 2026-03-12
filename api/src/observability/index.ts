import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

let sdk: NodeSDK | undefined;

/**
 * 初始化可观测性（OpenTelemetry）
 * 必须在所有其他导入之前调用
 */
export function initObservability(): void {
  // 默认关闭
  const enabled = process.env.OTEL_ENABLED === 'true';
  if (!enabled) {
    return;
  }

  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317';

  const traceExporter = new OTLPTraceExporter({ url: endpoint });
  const metricExporter = new OTLPMetricExporter({ url: endpoint });

  sdk = new NodeSDK({
    serviceName: process.env.APP_NAME || 'apartment-ultra-api',
    traceExporter,
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 60000, // 每 60 秒导出一次
    }),
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new PrismaInstrumentation(),
    ],
  });

  sdk.start();
  console.log('[Observability] OpenTelemetry initialized');

  // 优雅关闭
  const shutdown = async () => {
    if (sdk) {
      await sdk.shutdown();
      console.log('[Observability] OpenTelemetry shutdown');
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
