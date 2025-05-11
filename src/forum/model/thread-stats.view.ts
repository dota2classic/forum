import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  name: 'thread_stats_view',
  materialized: true,
  expression: `
SELECT me.thread_id as thread_id,
       count(*)::int as message_count,
       (count(me) filter(where "me"."created_at" >= NOW() - '8 hours'::interval))::int as "new_message_count"
FROM message_entity me
GROUP BY 1
`,
})
export class ThreadStatsView {
  @ViewColumn({ name: 'thread_id' })
  threadId: string;

  @ViewColumn({ name: 'message_count' })
  messageCount: number;

  @ViewColumn({ name: 'new_message_count' })
  newMessageCount: number;
}
