import { ClientsModule, RedisOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

export const RedisClient = () =>
  ClientsModule.registerAsync([
    {
      name: 'QueryCore',
      useFactory(config: ConfigService): RedisOptions {
        return {
          transport: Transport.REDIS,
          options: {
            host: config.get('redis.host'),
            password: config.get('redis.password'),
          },
        } satisfies RedisOptions;
      },
      inject: [ConfigService],
      imports: [],
    },
  ]);
