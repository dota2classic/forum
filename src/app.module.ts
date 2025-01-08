import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entities } from './typeorm-config';
import { ForumController } from './forum/forum.controller';
import { ForumService } from './forum/forum.service';
import { CqrsModule } from '@nestjs/cqrs';
import { ForumMapper } from './forum/forum.mapper';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './forum/health.controller';
import { AppService } from './app.service';
import { RedisClient } from './provide/redis.client';
import { EmoticonService } from './forum/emoticon.service';
import { S3Module } from 'nestjs-s3';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';
import configuration from './configuration';
import { S3ModuleOptions } from 'nestjs-s3/dist/s3.interfaces';
import { MessageService } from './forum/message.service';

@Module({
  imports: [
    TerminusModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      useFactory(config: ConfigService): TypeOrmModuleOptions {
        return {
          type: 'postgres',
          database: 'postgres',
          host: config.get('postgres.host'),
          port: 5432,
          username: config.get('postgres.username'),
          password: config.get('postgres.password'),
          entities: Entities,
          synchronize: true,

          maxQueryExecutionTime: 200,

          ssl: false,
        };
      },
      imports: [],
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(Entities),
    CqrsModule,
    RedisClient(),
    S3Module.forRootAsync({
      useFactory(config: ConfigService): S3ModuleOptions {
        return {
          config: {
            credentials: {
              accessKeyId: config.get('s3.accessKeyId'),
              secretAccessKey: config.get('s3.accessKeySecret'),
            },
            region: 'any',
            endpoint: config.get('s3.endpoint'),
            forcePathStyle: true,
          },
        };
      },
      inject: [ConfigService],
      imports: [],
    }),
  ],
  controllers: [ForumController, HealthController],
  providers: [
    ForumService,
    ForumMapper,
    AppService,
    EmoticonService,
    MessageService,
  ],
})
export class AppModule {}
