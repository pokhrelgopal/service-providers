import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * M7 — service-request broadcasts. A seeker broadcasts a need (skill +
 * description) at a point with a radius; matching available providers within
 * that radius see it until it expires. Providers raise their hand via
 * service_request_responses.
 */
export class CreateServiceRequests1781500000000 implements MigrationInterface {
  name = 'CreateServiceRequests1781500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "service_requests_status_enum" AS ENUM ('open', 'cancelled', 'expired', 'fulfilled')`,
    );
    await queryRunner.query(`
      CREATE TABLE "service_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "seekerId" uuid NOT NULL,
        "skillId" uuid NOT NULL,
        "description" text NOT NULL,
        "latitude" double precision NOT NULL,
        "longitude" double precision NOT NULL,
        "radius" integer NOT NULL,
        "status" "service_requests_status_enum" NOT NULL DEFAULT 'open',
        "expiresAt" timestamptz NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_service_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_service_requests_seeker" FOREIGN KEY ("seekerId")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_service_requests_skill" FOREIGN KEY ("skillId")
          REFERENCES "skills"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_service_requests_status" ON "service_requests" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_requests_expiresAt" ON "service_requests" ("expiresAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_requests_geo" ON "service_requests"
       USING gist (ll_to_earth("latitude", "longitude"))`,
    );

    await queryRunner.query(`
      CREATE TABLE "service_request_responses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "requestId" uuid NOT NULL,
        "providerId" uuid NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_service_request_responses" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_response_request_provider" UNIQUE ("requestId", "providerId"),
        CONSTRAINT "FK_response_request" FOREIGN KEY ("requestId")
          REFERENCES "service_requests"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_response_provider" FOREIGN KEY ("providerId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "service_request_responses"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_requests_geo"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_service_requests_expiresAt"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_service_requests_status"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "service_requests"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "service_requests_status_enum"`,
    );
  }
}
