import { MigrationInterface, QueryRunner } from 'typeorm';

export class ThreadStatsView1746960613406 implements MigrationInterface {
  name = 'ThreadStatsView1746960613406';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE MATERIALIZED VIEW "thread_stats_view" AS 
SELECT me.thread_id as thread_id,
       count(*)::int as message_count,
       (count(me) filter(where "me"."created_at" >= NOW() - '8 hours'::interval))::int as "new_message_count"
FROM message_entity me
GROUP BY 1
`);
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        'public',
        'MATERIALIZED_VIEW',
        'thread_stats_view',
        'SELECT me.thread_id as thread_id,\n       count(*)::int as message_count,\n       (count(me) filter(where "me"."created_at" >= NOW() - \'8 hours\'::interval))::int as "new_message_count"\nFROM message_entity me\nGROUP BY 1',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['MATERIALIZED_VIEW', 'thread_stats_view', 'public'],
    );
    await queryRunner.query(`DROP MATERIALIZED VIEW "thread_stats_view"`);
  }
}
