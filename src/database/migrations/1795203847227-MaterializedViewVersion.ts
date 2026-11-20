import { MigrationInterface, QueryRunner } from 'typeorm';

export class MaterializedViewVersion1795203847227
  implements MigrationInterface
{
  name = 'MaterializedViewVersion1795203847227';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "materialized_view_state" ("view_name" text PRIMARY KEY, "version" bigint NOT NULL DEFAULT 1, "refreshed_version" bigint NOT NULL DEFAULT 0)`,
    );
    await queryRunner.query(
      `INSERT INTO "materialized_view_state" ("view_name") VALUES ('last_message_view_materialized')`,
    );
    await queryRunner.query(
      `CREATE FUNCTION "bump_materialized_view_version"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE "materialized_view_state" SET "version" = "version" + 1 WHERE "view_name" = TG_ARGV[0];
  RETURN NULL;
END
$$`,
    );
    await queryRunner.query(
      `CREATE TRIGGER "message_entity_bumps_last_message_view" AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE ON "message_entity" FOR EACH STATEMENT EXECUTE FUNCTION "bump_materialized_view_version"('last_message_view_materialized')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER "message_entity_bumps_last_message_view" ON "message_entity"`,
    );
    await queryRunner.query(`DROP FUNCTION "bump_materialized_view_version"()`);
    await queryRunner.query(`DROP TABLE "materialized_view_state"`);
  }
}
