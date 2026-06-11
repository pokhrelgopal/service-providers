import { MigrationInterface, QueryRunner } from 'typeorm';

/** Chat messages can carry an image (e.g. a photo of the problem). Body becomes
 * optional so a message can be image-only. */
export class AddMessageImage1781900000000 implements MigrationInterface {
  name = 'AddMessageImage1781900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "body" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD COLUMN "imageKey" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "imageKey"`);
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "body" SET NOT NULL`,
    );
  }
}
