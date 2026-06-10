import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Example/foundational migration: enables the Postgres extensions used for
 * "providers around me" radius search in Milestone 6. The docker init script
 * also enables these on a fresh cluster; migrations remain the schema source of
 * truth, so this is idempotent and safe to run anywhere.
 */
export class EnableGeoExtensions1718000000000 implements MigrationInterface {
  name = 'EnableGeoExtensions1718000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS cube;');
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS earthdistance;');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP EXTENSION IF EXISTS earthdistance;');
    await queryRunner.query('DROP EXTENSION IF EXISTS cube;');
  }
}
