import { MigrationInterface, QueryRunner } from 'typeorm';

export class Fix1770237367696 implements MigrationInterface {
  name = 'Fix1770237367696';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "thread_entity" DROP CONSTRAINT "FK_3bdccec32cab9a175a7428ab04d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "thread_entity" DROP CONSTRAINT "UQ_3bdccec32cab9a175a7428ab04d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "thread_entity" DROP COLUMN "pinnedMessageId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_entity" ALTER COLUMN "updated_at" SET DEFAULT 'now()'`,
    );
    await queryRunner.query(
      `ALTER TABLE "thread_entity" DROP COLUMN "pinned_message_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "thread_entity" ADD "pinned_message_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "thread_entity" ADD CONSTRAINT "UQ_d8389659a2c9624d05c6ff18968" UNIQUE ("pinned_message_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "thread_entity" ADD CONSTRAINT "FK_d8389659a2c9624d05c6ff18968" FOREIGN KEY ("pinned_message_id") REFERENCES "message_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "thread_entity" DROP CONSTRAINT "FK_d8389659a2c9624d05c6ff18968"`,
    );
    await queryRunner.query(
      `ALTER TABLE "thread_entity" DROP CONSTRAINT "UQ_d8389659a2c9624d05c6ff18968"`,
    );
    await queryRunner.query(
      `ALTER TABLE "thread_entity" DROP COLUMN "pinned_message_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "thread_entity" ADD "pinned_message_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_entity" ALTER COLUMN "updated_at" SET DEFAULT '2026-02-04 18:20:03.947872+00'`,
    );
    await queryRunner.query(
      `ALTER TABLE "thread_entity" ADD "pinnedMessageId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "thread_entity" ADD CONSTRAINT "UQ_3bdccec32cab9a175a7428ab04d" UNIQUE ("pinnedMessageId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "thread_entity" ADD CONSTRAINT "FK_3bdccec32cab9a175a7428ab04d" FOREIGN KEY ("pinnedMessageId") REFERENCES "message_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
