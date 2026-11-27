import { MigrationInterface, QueryRunner } from 'typeorm';

export class SecretQueueChat1795204000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO thread_entity (id, external_id, thread_type, title)
      VALUES ('forum_secret-queue-chat', 'secret-queue-chat', 'forum', 'SECRET')
      ON CONFLICT (id) DO NOTHING
    `);
  }

  async down(): Promise<void> {
    // Preserve the reserved thread and any existing messages.
  }
}
