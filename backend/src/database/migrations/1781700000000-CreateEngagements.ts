import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * M8 — engagements + messaging. Seeker accepts one provider → an active
 * engagement locks both sides (partial unique indexes guarantee one active
 * engagement per seeker and per provider). Minimal chat messages hang off it.
 */
export class CreateEngagements1781700000000 implements MigrationInterface {
  name = 'CreateEngagements1781700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "engagements_status_enum" AS ENUM ('active', 'completed')`,
    );
    await queryRunner.query(`
      CREATE TABLE "engagements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "requestId" uuid NOT NULL,
        "seekerId" uuid NOT NULL,
        "providerId" uuid NOT NULL,
        "status" "engagements_status_enum" NOT NULL DEFAULT 'active',
        "seekerReadAt" timestamptz,
        "providerReadAt" timestamptz,
        "completedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_engagements" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_engagement_request" UNIQUE ("requestId"),
        CONSTRAINT "FK_engagement_request" FOREIGN KEY ("requestId")
          REFERENCES "service_requests"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_engagement_seeker" FOREIGN KEY ("seekerId")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_engagement_provider" FOREIGN KEY ("providerId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_engagements_status" ON "engagements" ("status")`,
    );
    // One active engagement per seeker, and per provider.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_active_engagement_seeker" ON "engagements" ("seekerId") WHERE "status" = 'active'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_active_engagement_provider" ON "engagements" ("providerId") WHERE "status" = 'active'`,
    );

    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "engagementId" uuid NOT NULL,
        "senderId" uuid NOT NULL,
        "body" text NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_message_engagement" FOREIGN KEY ("engagementId")
          REFERENCES "engagements"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_message_sender" FOREIGN KEY ("senderId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_engagement" ON "messages" ("engagementId", "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "messages"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_active_engagement_provider"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_active_engagement_seeker"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_engagements_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "engagements"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "engagements_status_enum"`);
  }
}
