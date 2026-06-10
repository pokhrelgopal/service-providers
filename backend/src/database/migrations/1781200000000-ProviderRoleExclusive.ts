import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeker and provider are now mutually exclusive. Any existing user who is both
 * becomes provider-only (the seeker role is dropped; admin is preserved).
 * Irreversible — we can't know who was originally a seeker.
 */
export class ProviderRoleExclusive1781200000000 implements MigrationInterface {
  name = 'ProviderRoleExclusive1781200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users"
      SET "roles" = array_remove("roles", 'seeker'::"public"."users_roles_enum")
      WHERE "roles" @> ARRAY['seeker', 'provider']::"public"."users_roles_enum"[]
    `);
  }

  public async down(): Promise<void> {
    // No-op: original seeker assignments can't be reconstructed.
  }
}
