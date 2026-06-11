import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the provider's discovery location + availability, plus a GiST index on
 * ll_to_earth(latitude, longitude) for index-backed "providers around me"
 * radius search (cube + earthdistance, enabled in earlier migrations).
 */
export class AddProviderLocationAvailability1781400000000 implements MigrationInterface {
  name = 'AddProviderLocationAvailability1781400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "provider_profiles" ADD COLUMN "latitude" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_profiles" ADD COLUMN "longitude" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_profiles" ADD COLUMN "isAvailable" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_provider_geo" ON "provider_profiles"
       USING gist (ll_to_earth("latitude", "longitude"))
       WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_provider_geo"`);
    await queryRunner.query(
      `ALTER TABLE "provider_profiles" DROP COLUMN "isAvailable"`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_profiles" DROP COLUMN "longitude"`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_profiles" DROP COLUMN "latitude"`,
    );
  }
}
