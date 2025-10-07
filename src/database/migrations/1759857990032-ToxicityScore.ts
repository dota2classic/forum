import { MigrationInterface, QueryRunner } from 'typeorm';

export class ToxicityScore1759857990032 implements MigrationInterface {
  name = 'ToxicityScore1759857990032';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "forum_user_entity" ADD "toxic_counter" integer NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "forum_user_entity" DROP COLUMN "toxic_counter"`,
    );
  }
}
