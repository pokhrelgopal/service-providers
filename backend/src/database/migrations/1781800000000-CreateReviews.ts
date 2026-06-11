import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * M9 — ratings & reviews. A seeker reviews a provider once per completed
 * engagement. Aggregates are denormalized onto provider_profiles
 * (ratingCount/ratingSum) so discovery cards need no join.
 */
export class CreateReviews1781800000000 implements MigrationInterface {
  name = 'CreateReviews1781800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "provider_profiles" ADD COLUMN "ratingCount" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_profiles" ADD COLUMN "ratingSum" integer NOT NULL DEFAULT 0`,
    );

    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "engagementId" uuid NOT NULL,
        "seekerId" uuid NOT NULL,
        "providerId" uuid NOT NULL,
        "rating" integer NOT NULL,
        "comment" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_review_engagement" UNIQUE ("engagementId"),
        CONSTRAINT "CHK_review_rating" CHECK ("rating" BETWEEN 1 AND 5),
        CONSTRAINT "FK_review_engagement" FOREIGN KEY ("engagementId")
          REFERENCES "engagements"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_review_seeker" FOREIGN KEY ("seekerId")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_review_provider" FOREIGN KEY ("providerId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_provider" ON "reviews" ("providerId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews"`);
    await queryRunner.query(
      `ALTER TABLE "provider_profiles" DROP COLUMN "ratingSum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_profiles" DROP COLUMN "ratingCount"`,
    );
  }
}
