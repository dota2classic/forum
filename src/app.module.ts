import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entities, prodDbConfig } from './typeorm-config';
import { ForumController } from './forum/forum.controller';
import { ForumService } from './forum/forum.service';
import { CqrsModule } from '@nestjs/cqrs';
import { ForumMapper } from './forum/forum.mapper';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './forum/health.controller';
import { AppService } from './app.service';
import { RedisClient } from './provide/redis.client';

@Module({
  imports: [
    TerminusModule,
    TypeOrmModule.forRoot(prodDbConfig),
    TypeOrmModule.forFeature(Entities),
    CqrsModule,
    RedisClient(),
  ],
  controllers: [ForumController, HealthController],
  providers: [ForumService, ForumMapper, AppService],
})
export class AppModule {}
