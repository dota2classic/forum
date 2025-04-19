import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProperIndexThreadEntity1745070155741
  implements MigrationInterface
{
  name = 'ProperIndexThreadEntity1745070155741';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."external_id_thread_type_index"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "external_id_thread_type_index" ON "thread_entity" ("thread_type", "external_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."external_id_thread_type_index"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "external_id_thread_type_index" ON "thread_entity" ("external_id", "thread_type") `,
    );
  }
}
