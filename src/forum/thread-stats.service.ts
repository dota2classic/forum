import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import Redlock from 'redlock';

const MATERIALIZED_VIEWS = [
  'thread_stats_view',
  'last_message_view_materialized',
];
const REFRESH_WORK_MEM = '64MB';
const REFRESH_CRON = '30 1-59/5 * * * *';

@Injectable()
export class ThreadStatsService {
  private logger = new Logger(ThreadStatsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly redlock: Redlock,
  ) {}

  @Cron(REFRESH_CRON)
  public async refreshView() {
    await this.redlock.using(
      [`${ThreadStatsService.name}_materialized_views`],
      10000,
      async (signal) => {
        const refreshed: string[] = [];
        for (const view of MATERIALIZED_VIEWS) {
          if (await this.refreshIfStale(view)) refreshed.push(view);
        }
        if (signal.aborted) {
          throw signal.error;
        }
        this.logger.log(`Refreshed views: ${refreshed.join(', ') || 'none'}`);
      },
    );
  }

  private refreshIfStale(view: string): Promise<boolean> {
    return this.dataSource.transaction(async (em) => {
      const [state]: { version: string; refreshed_version: string }[] =
        await em.query(
          `SELECT version, refreshed_version FROM materialized_view_state WHERE view_name = $1`,
          [view],
        );
      if (state && state.version === state.refreshed_version) return false;

      await em.query(`SET LOCAL work_mem = '${REFRESH_WORK_MEM}'`);
      await em.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${view}`);
      if (state) {
        await em.query(
          `UPDATE materialized_view_state SET refreshed_version = GREATEST(refreshed_version, $2) WHERE view_name = $1`,
          [view, state.version],
        );
      }
      return true;
    });
  }
}
