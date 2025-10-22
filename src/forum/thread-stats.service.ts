import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ThreadEntity } from './model/thread.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import Redlock from 'redlock';

@Injectable()
export class ThreadStatsService implements OnApplicationBootstrap {
  private logger = new Logger(ThreadStatsService.name);

  constructor(
    @InjectRepository(ThreadEntity)
    private readonly threadEntityRepository: Repository<ThreadEntity>,
    private readonly redlock: Redlock,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  public async refreshView() {
    await this.redlock.using(
      [`${ThreadStatsService.name}_materialized_views`],
      10000,
      async (signal) => {
        await this.threadEntityRepository.query(
          `REFRESH MATERIALIZED VIEW thread_stats_view;`,
        );
        await this.threadEntityRepository.query(
          `REFRESH MATERIALIZED VIEW last_message_view_materialized;`,
        );
        if (signal.aborted) {
          throw signal.error;
        }
        this.logger.log('Updated views');
      },
    );
  }

  async onApplicationBootstrap() {
    await this.refreshView();
  }
}
