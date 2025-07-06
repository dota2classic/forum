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
import { getTypeormConfig } from './config/typeorm.config';
import { ThreadStatsService } from './forum/thread-stats.service';
import { ClientsModule, RmqOptions, Transport } from '@nestjs/microservices';
import { RabbitMQConfig, RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

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
          ...getTypeormConfig(config),
          type: 'postgres',
          database: 'postgres',
          migrations: ['dist/database/migrations/*.*'],
          migrationsRun: true,
          // maxQueryExecutionTime: 50,
          logging: undefined,
        } satisfies TypeOrmModuleOptions;
      },
      imports: [],
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(Entities),
    CqrsModule,
    RedisClient(),
    ClientsModule.registerAsync([
      {
        name: 'RabbitMQ',
        useFactory(config: ConfigService): RmqOptions {
          return {
            transport: Transport.RMQ,
            options: {
              urls: [
                {
                  hostname: config.get<string>('rabbitmq.host'),
                  port: config.get<number>('rabbitmq.port'),
                  protocol: 'amqp',
                  username: config.get<string>('rabbitmq.user'),
                  password: config.get<string>('rabbitmq.password'),
                },
              ],
              prefetchCount: 5,
            },
          };
        },
        inject: [ConfigService],
        imports: [],
      },
    ]),
    RabbitMQModule.forRootAsync({
      useFactory(config: ConfigService): RabbitMQConfig {
        return {
          exchanges: [
            {
              name: 'app.events',
              type: 'topic',
            },
          ],
          uri: `amqp://${config.get('rabbitmq.user')}:${config.get('rabbitmq.password')}@${config.get('rabbitmq.host')}:${config.get('rabbitmq.port')}`,
        };
      },
      imports: [],
      inject: [ConfigService],
    }),
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
    ThreadStatsService,
  ],
})
export class AppModule {}
