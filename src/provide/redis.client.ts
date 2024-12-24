import { ClientsModule, Transport } from '@nestjs/microservices';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from '../env';

export const RedisClient = () =>
  ClientsModule.register([
    {
      name: 'QueryCore',
      transport: Transport.REDIS,
      options: {
        host: REDIS_HOST(),
        port: parseInt(REDIS_PORT() as string),
        retryAttempts: Infinity,
        password: REDIS_PASSWORD(),
        retryDelay: 5000,
      },
    },
  ]);
