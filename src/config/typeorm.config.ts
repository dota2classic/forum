import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import configuration from '../configuration';
import { Entities } from '../typeorm-config';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export const getTypeormConfig = (
  cs: ConfigService,
): PostgresConnectionOptions => {
  return {
    type: 'postgres',
    database: 'postgres',

    port: 5432,
    host: cs.get('postgres.host'),
    username: cs.get('postgres.username'),
    password: cs.get('postgres.password'),
    synchronize: false,
    entities: Entities,
    migrations: ['src/database/migrations/*.*'],
    migrationsRun: false,
    migrationsTableName: 'forum_migrations',
    logging: true,
  };
};

const AppDataSource = new DataSource(
  getTypeormConfig(new ConfigService(configuration('config.yaml'))),
);

export default AppDataSource;
