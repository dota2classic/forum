import { ClientsModule } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { getRedisTransportOptions } from '../config/redis.config';

export const RedisClient = () =>
  ClientsModule.registerAsync([
    {
      name: 'QueryCore',
      useFactory: getRedisTransportOptions,
      inject: [ConfigService],
      imports: [],
    },
  ]);
