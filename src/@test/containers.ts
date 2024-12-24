import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DynamicModule } from '@nestjs/common';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';

export const withPostgres = async (
  Entities: any[],
): Promise<[StartedPostgreSqlContainer, DynamicModule[]]> => {
  let container = await new PostgreSqlContainer()
    .withUsername('username')
    .withPassword('password')
    .start();

  const imports = [
    TypeOrmModule.forRoot({
      host: container.getHost(),
      port: container.getFirstMappedPort(),

      type: 'postgres',
      database: 'postgres',

      username: container.getUsername(),
      password: container.getPassword(),
      entities: Entities,
      synchronize: true,
      dropSchema: false,
      ssl: false,
    }),
    TypeOrmModule.forFeature(Entities),
  ];

  return [container, imports];
};

export const withRedis = async (): Promise<StartedRedisContainer> => {
  const container = await new RedisContainer().withPassword('password').start();

  return container;
};
