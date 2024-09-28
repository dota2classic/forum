import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entities, testDbConfig } from './typeorm-config';
import { ForumController } from './forum/forum.controller';
import { ForumService } from './forum/forum.service';
import { CqrsModule } from '@nestjs/cqrs';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from './env';
import { ForumMapper } from './forum/forum.mapper';

@Module({
  imports: [
    TypeOrmModule.forRoot(testDbConfig),
    TypeOrmModule.forFeature(Entities),
    CqrsModule,
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
    ]),
  ],
  controllers: [ForumController],
  providers: [ForumService, ForumMapper],
})
export class AppModule {}
