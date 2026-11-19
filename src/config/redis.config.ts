import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { RedisOptions, Transport } from '@nestjs/microservices';
import Redis from 'ioredis';

export const getRedisTransportOptions = (cs: ConfigService): RedisOptions => ({
  transport: Transport.REDIS,
  options: {
    host: cs.get('redis.host'),
    password: cs.get('redis.password'),
    retryAttempts: Infinity,
    retryDelay: 2000,
  },
});

export const logRedisErrors = (client: Redis, name: string): Redis => {
  const logger = new Logger(name);
  return client.on('error', (e) => logger.warn(`Redis connection error: ${e.message}`));
};
