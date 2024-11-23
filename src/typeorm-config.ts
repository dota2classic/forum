import { DB_HOST, DB_PASSWORD, DB_USERNAME } from './env';
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';
import { ThreadEntity } from './forum/model/thread.entity';
import { MessageEntity } from './forum/model/message.entity';
import { ForumUserEntity } from './forum/model/forum-user.entity';
import { LastMessageView } from './forum/model/last-message.view';

export const Entities = [
  ThreadEntity,
  MessageEntity,
  ForumUserEntity,
  LastMessageView,
];

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

  connectTimeoutMS: 500,

  // logging: ['warn', 'error', 'info'],
  logging: ['warn', 'error', 'info'],
  maxQueryExecutionTime: 1000,
  extra: { max: 20 },

  synchronize: true,
  dropSchema: false,

  poolErrorHandler(err) {
    console.log('AMOGUS');
    console.log(err);
  },
  ssl: false,
};
