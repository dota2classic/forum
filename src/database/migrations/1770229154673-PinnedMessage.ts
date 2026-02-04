import { MigrationInterface, QueryRunner } from 'typeorm';

export class PinnedMessage1770229154673 implements MigrationInterface {
  name = 'PinnedMessage1770229154673';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "thread_entity" ADD "pinned_message_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "thread_entity" ADD "pinnedMessageId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "thread_entity" ADD CONSTRAINT "UQ_3bdccec32cab9a175a7428ab04d" UNIQUE ("pinnedMessageId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_entity" ALTER COLUMN "updated_at" SET DEFAULT 'now()'`,
    );
    await queryRunner.query(
      `ALTER TABLE "thread_entity" ADD CONSTRAINT "FK_3bdccec32cab9a175a7428ab04d" FOREIGN KEY ("pinnedMessageId") REFERENCES "message_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "thread_entity" DROP CONSTRAINT "FK_3bdccec32cab9a175a7428ab04d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_entity" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-04 18:18:17.44507+00'`,
    );
    await queryRunner.query(
      `ALTER TABLE "thread_entity" DROP CONSTRAINT "UQ_3bdccec32cab9a175a7428ab04d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "thread_entity" DROP COLUMN "pinnedMessageId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "thread_entity" DROP COLUMN "pinned_message_id"`,
    );
  }
}
