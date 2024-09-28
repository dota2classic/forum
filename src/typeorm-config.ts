import { DB_HOST, DB_PASSWORD, DB_USERNAME } from './env';
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';
import { ThreadEntity } from './forum/model/thread.entity';
import { MessageEntity } from './forum/model/message.entity';

export const Entities = [ThreadEntity, MessageEntity];

export const testDbConfig: TypeOrmModuleOptions = {
         type: 'sqlite',
         database: ':memory:',
         entities: Entities,
         synchronize: true,
         keepConnectionAlive: true,
         // dropSchema: true,
       };

export const prodDbConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  database: 'postgres',
  host: DB_HOST(),
  port: 5432,
  username: DB_USERNAME(),
  password: DB_PASSWORD,
  entities: Entities,
  synchronize: true,
  maxQueryExecutionTime: 1000,

  ssl: false,
};
