export interface ExpectedConfig {
  redis: {
    host: string;
    password: string;
  };
  s3: {
    accessKeyId: string;
    accessKeySecret: string;
    endpoint: string;
  };
  postgres: {
    host: string;
    port: number;
    username: string;
    password: string;
  };
  telemetry: {
    jaeger: {
      url: string;
    };
  };
}

export default (): ExpectedConfig => {
  return {
    redis: {
      host: process.env.REDIS_HOST,
      password: process.env.REDIS_PASSWORD,
    },
    s3: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.S3_ACCESS_KEY_SECRET || '',
      endpoint: process.env.S3_ENDPOINT || '',
    },
    postgres: {
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      username: process.env.POSTGRES_USERNAME,
      password: process.env.POSTGRES_PASSWORD,
    },
    telemetry: {
      jaeger: {
        url: process.env.JAEGER_URL || 'http://localhost:4317',
      },
    },
  } as ExpectedConfig;
};
