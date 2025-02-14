import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1739384667133 implements MigrationInterface {
  name = 'InitialMigration1739384667133';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "reaction_entity" ("message_id" uuid NOT NULL, "emoticon_id" integer NOT NULL, "author" character varying NOT NULL, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_194d01ba6671f288a1c1cbd58b1" PRIMARY KEY ("message_id", "emoticon_id", "author"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "message_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "author" character varying NOT NULL, "content" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "deleted" boolean NOT NULL DEFAULT false, "edited" boolean NOT NULL DEFAULT false, "reply_message_id" uuid, "thread_id" character varying NOT NULL, CONSTRAINT "PK_45bb3707fbb99a73e831fee41e0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2aec657cdd52b2afb8ca09b192" ON "message_entity" ("thread_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "thread_entity" ("id" character varying NOT NULL, "external_id" character varying NOT NULL, "thread_type" character varying NOT NULL, "title" character varying NOT NULL, "views" integer NOT NULL DEFAULT '0', "pinned" boolean NOT NULL DEFAULT false, "admin_only" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_9eb2b5c306ba3263fe3f8753634" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9eb2b5c306ba3263fe3f875363" ON "thread_entity" ("id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "external_id_thread_type_index" ON "thread_entity" ("external_id", "thread_type") `,
    );
    await queryRunner.query(
      `CREATE TABLE "forum_user_entity" ("steam_id" character varying NOT NULL, "muted_until" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_76214f1949e09bf2dec31ce48c4" PRIMARY KEY ("steam_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "emoticon_entity" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "bucket" character varying NOT NULL, "key" character varying NOT NULL, CONSTRAINT "PK_406913926e435bf4ad33e20d382" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_2369a43f7b60f35f55f567db94" ON "emoticon_entity" ("code") `,
    );
    await queryRunner.query(
      `ALTER TABLE "reaction_entity" ADD CONSTRAINT "FK_7f64efe40164a837f954a54cb01" FOREIGN KEY ("message_id") REFERENCES "message_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_entity" ADD CONSTRAINT "FK_message_reply" FOREIGN KEY ("reply_message_id") REFERENCES "message_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_entity" ADD CONSTRAINT "FK_thread_message" FOREIGN KEY ("thread_id") REFERENCES "thread_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'last_message_view', 'public'],
    );
    await queryRunner.query(`DROP VIEW "last_message_view"`);
    await queryRunner.query(
      `ALTER TABLE "message_entity" DROP CONSTRAINT "FK_thread_message"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_entity" DROP CONSTRAINT "FK_message_reply"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reaction_entity" DROP CONSTRAINT "FK_7f64efe40164a837f954a54cb01"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2369a43f7b60f35f55f567db94"`,
    );
    await queryRunner.query(`DROP TABLE "emoticon_entity"`);
    await queryRunner.query(`DROP TABLE "forum_user_entity"`);
    await queryRunner.query(
      `DROP INDEX "public"."external_id_thread_type_index"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9eb2b5c306ba3263fe3f875363"`,
    );
    await queryRunner.query(`DROP TABLE "thread_entity"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2aec657cdd52b2afb8ca09b192"`,
    );
    await queryRunner.query(`DROP TABLE "message_entity"`);
    await queryRunner.query(`DROP TABLE "reaction_entity"`);
  }
}
