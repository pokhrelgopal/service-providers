import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A seeker can only broadcast one request at a time. Partial unique index
 * guarantees at most one OPEN service_request per seeker at the DB level
 * (the service also supersedes previous open ones on create).
 */
export class OneOpenRequestPerSeeker1781600000000
  implements MigrationInterface
{
  name = 'OneOpenRequestPerSeeker1781600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_one_open_request_per_seeker"
       ON "service_requests" ("seekerId") WHERE "status" = 'open'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_one_open_request_per_seeker"`,
    );
  }
}
