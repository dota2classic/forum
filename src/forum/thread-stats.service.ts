import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ThreadEntity } from './model/thread.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ThreadStatsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(ThreadEntity)
    private readonly threadEntityRepository: Repository<ThreadEntity>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  public async refreshView() {
    await this.threadEntityRepository.query(
      `REFRESH MATERIALIZED VIEW thread_stats_view;`,
    );

    await this.threadEntityRepository.query(
      `REFRESH MATERIALIZED VIEW last_message_view_materialized;`,
    );
  }

  async onApplicationBootstrap() {
    await this.refreshView();
  }
}
