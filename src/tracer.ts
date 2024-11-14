import { NodeSDK } from '@opentelemetry/sdk-node';
import * as process from 'process';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { TypeormInstrumentation } from 'opentelemetry-instrumentation-typeorm';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { JAEGER_EXPORT_URL } from './env';

const exporterOptions = {
  url: JAEGER_EXPORT_URL, // grcp
};

const traceExporter = new OTLPTraceExporter(exporterOptions);

export const otelSDK = new NodeSDK({
  traceExporter,
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new NestInstrumentation(),
    new PgInstrumentation(),
    new TypeormInstrumentation({
      enabled: true,
      enableInternalInstrumentation: true,
    }),
  ],
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'forum',
  }),
});

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
  otelSDK
    .shutdown()
    .then(
      () => console.log('SDK shut down successfully'),
      (err) => console.log('Error shutting down SDK', err),
    )
    .finally(() => process.exit(0));
});
