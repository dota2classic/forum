import { MigrationInterface, QueryRunner } from 'typeorm';

const INDEXES = [
  {
    name: 'IDX_thread_stats_view_thread_id',
    view: 'thread_stats_view',
    columns: '"thread_id"',
  },
  {
    name: 'IDX_last_message_view_materialized_id_is_last',
    view: 'last_message_view_materialized',
    columns: '"id", "is_last"',
  },
];

export class MaterializedViewUniqueIndexes1795117491388
  implements MigrationInterface
{
  name = 'MaterializedViewUniqueIndexes1795117491388';
  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const index of INDEXES) {
      const invalid = await queryRunner.query(
        `SELECT 1 FROM pg_index i INNER JOIN pg_class c ON c.oid = i.indexrelid WHERE c.relname = $1 AND NOT i.indisvalid`,
        [index.name],
      );
      if (invalid.length > 0) {
        await queryRunner.query(
          `DROP INDEX CONCURRENTLY IF EXISTS "${index.name}"`,
        );
      }
      await queryRunner.query(
        `CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "${index.name}" ON "${index.view}" (${index.columns})`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const index of INDEXES) {
      await queryRunner.query(
        `DROP INDEX IF EXISTS "${index.name}"`,
      );
    }
  }
}
