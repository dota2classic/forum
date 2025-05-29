import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ThreadEntity } from './model/thread.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ThreadStatsService implements OnApplicationBootstrap {
  private logger = new Logger(ThreadStatsService.name);

  constructor(
    @InjectRepository(ThreadEntity)
    private readonly threadEntityRepository: Repository<ThreadEntity>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  public async refreshView() {
    try {
      await this.threadEntityRepository.query(
        `REFRESH MATERIALIZED VIEW thread_stats_view;`,
      );
      await this.threadEntityRepository.query(
        `REFRESH MATERIALIZED VIEW last_message_view_materialized;`,
      );
    } catch (e) {
      this.logger.warn('Error updating views');
    }
  }

  async onApplicationBootstrap() {
    await this.refreshView();
  }
}
