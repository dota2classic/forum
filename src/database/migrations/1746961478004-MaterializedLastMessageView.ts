import { MigrationInterface, QueryRunner } from 'typeorm';

export class MaterializedLastMessageView1746961478004
  implements MigrationInterface
{
  name = 'MaterializedLastMessageView1746961478004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE MATERIALIZED VIEW "last_message_view_materialized" AS with latest as (select max(me.created_at) as msg_date, me.thread_id, true as last
                from message_entity me
                where me.deleted = false
                group by me.thread_id
                union all
                select min(me.created_at) as msg_date, me.thread_id, false as last
                from message_entity me
                where me.deleted = false
                group by me.thread_id)
select me.id,
       me.author,
       me.content,
       me.created_at,
       me.updated_at,
       me.thread_id,
       me.deleted,
       latest.last as is_last
from latest
         inner join message_entity me
                    on me.created_at = latest.msg_date and me.thread_id = latest.thread_id`);
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        'public',
        'MATERIALIZED_VIEW',
        'last_message_view_materialized',
        'with latest as (select max(me.created_at) as msg_date, me.thread_id, true as last\n                from message_entity me\n                where me.deleted = false\n                group by me.thread_id\n                union all\n                select min(me.created_at) as msg_date, me.thread_id, false as last\n                from message_entity me\n                where me.deleted = false\n                group by me.thread_id)\nselect me.id,\n       me.author,\n       me.content,\n       me.created_at,\n       me.updated_at,\n       me.thread_id,\n       me.deleted,\n       latest.last as is_last\nfrom latest\n         inner join message_entity me\n                    on me.created_at = latest.msg_date and me.thread_id = latest.thread_id',
      ],
    );
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'last_message_view', 'public'],
    );
    await queryRunner.query(`DROP VIEW "last_message_view"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['MATERIALIZED_VIEW', 'last_message_view_materialized', 'public'],
    );
    await queryRunner.query(
      `DROP MATERIALIZED VIEW "last_message_view_materialized"`,
    );
    await queryRunner.query(`CREATE VIEW "last_message_view" AS with latest as (select max(me.created_at) as msg_date, me.thread_id, true as last
                from message_entity me
                where me.deleted = false
                group by me.thread_id
                union all
                select min(me.created_at) as msg_date, me.thread_id, false as last
                from message_entity me
                where me.deleted = false
                group by me.thread_id)
select me.id,
       me.author,
       me.content,
       me.created_at,
       me.updated_at,
       me.thread_id,
       me.deleted,
       latest.last as is_last
from latest
         inner join message_entity me
                    on me.created_at = latest.msg_date and me.thread_id = latest.thread_id`);
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        'public',
        'VIEW',
        'last_message_view',
        'with latest as (select max(me.created_at) as msg_date, me.thread_id, true as last\n                from message_entity me\n                where me.deleted = false\n                group by me.thread_id\n                union all\n                select min(me.created_at) as msg_date, me.thread_id, false as last\n                from message_entity me\n                where me.deleted = false\n                group by me.thread_id)\nselect me.id,\n       me.author,\n       me.content,\n       me.created_at,\n       me.updated_at,\n       me.thread_id,\n       me.deleted,\n       latest.last as is_last\nfrom latest\n         inner join message_entity me\n                    on me.created_at = latest.msg_date and me.thread_id = latest.thread_id',
      ],
    );
  }
}
