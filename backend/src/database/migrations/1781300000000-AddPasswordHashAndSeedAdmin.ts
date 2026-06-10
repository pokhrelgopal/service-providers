import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';

const ADMIN_EMAIL = 'admin@servio.com';
const ADMIN_PASSWORD = 'Password@123';

/** Adds password auth support and seeds the platform admin account. */
export class AddPasswordHashAndSeedAdmin1781300000000 implements MigrationInterface {
  name = 'AddPasswordHashAndSeedAdmin1781300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordHash" character varying`,
    );

    const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    await queryRunner.query(
      `INSERT INTO "users" ("email", "name", "passwordHash", "roles")
       VALUES ($1, $2, $3, ARRAY['admin']::"public"."users_roles_enum"[])
       ON CONFLICT ("email")
       DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash",
                     "roles" = EXCLUDED."roles"`,
      [ADMIN_EMAIL, 'Servio Admin', hash],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "users" WHERE "email" = $1`, [
      ADMIN_EMAIL,
    ]);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "passwordHash"`,
    );
  }
}
