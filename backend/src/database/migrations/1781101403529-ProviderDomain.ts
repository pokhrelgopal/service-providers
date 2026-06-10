import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProviderDomain1781101403529 implements MigrationInterface {
  name = 'ProviderDomain1781101403529';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "skills" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "name" character varying NOT NULL, "sortOrder" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_0d3212120f4ecedf90864d7e298" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_55b7acbf80551e7fa2b5a33ed6" ON "skills" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."documents_type_enum" AS ENUM('selfie', 'id_document')`,
    );
    await queryRunner.query(
      `CREATE TABLE "documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "providerProfileId" uuid NOT NULL, "type" "public"."documents_type_enum" NOT NULL, "objectKey" character varying NOT NULL, "thumbnailKey" character varying, "mimeType" character varying NOT NULL, "sizeBytes" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_775459fc9f92c6826f0e4ebc62" ON "documents" ("providerProfileId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."provider_profiles_status_enum" AS ENUM('draft', 'submitted', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "provider_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "legalName" character varying, "phoneCountry" character varying NOT NULL DEFAULT 'NP', "phoneDialCode" character varying NOT NULL DEFAULT '+977', "phoneNumber" character varying, "phoneVerified" boolean NOT NULL DEFAULT false, "serviceDescription" text, "status" "public"."provider_profiles_status_enum" NOT NULL DEFAULT 'draft', "rejectionReason" text, "submittedAt" TIMESTAMP WITH TIME ZONE, "reviewedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_96071d5ba65f9c64f0f2dfdfaf" UNIQUE ("userId"), CONSTRAINT "PK_0197ced76e32133df96a97168df" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_96071d5ba65f9c64f0f2dfdfaf" ON "provider_profiles" ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "provider_profile_skills" ("providerProfilesId" uuid NOT NULL, "skillsId" uuid NOT NULL, CONSTRAINT "PK_238b222b730383c8c243a1bc0e9" PRIMARY KEY ("providerProfilesId", "skillsId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a729df0400ea6090ae861ce299" ON "provider_profile_skills" ("providerProfilesId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ecef17fca331e3603152f7d467" ON "provider_profile_skills" ("skillsId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_775459fc9f92c6826f0e4ebc624" FOREIGN KEY ("providerProfileId") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_profiles" ADD CONSTRAINT "FK_96071d5ba65f9c64f0f2dfdfaf3" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_profile_skills" ADD CONSTRAINT "FK_a729df0400ea6090ae861ce2992" FOREIGN KEY ("providerProfilesId") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_profile_skills" ADD CONSTRAINT "FK_ecef17fca331e3603152f7d467a" FOREIGN KEY ("skillsId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "provider_profile_skills" DROP CONSTRAINT "FK_ecef17fca331e3603152f7d467a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_profile_skills" DROP CONSTRAINT "FK_a729df0400ea6090ae861ce2992"`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_profiles" DROP CONSTRAINT "FK_96071d5ba65f9c64f0f2dfdfaf3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_775459fc9f92c6826f0e4ebc624"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ecef17fca331e3603152f7d467"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a729df0400ea6090ae861ce299"`,
    );
    await queryRunner.query(`DROP TABLE "provider_profile_skills"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_96071d5ba65f9c64f0f2dfdfaf"`,
    );
    await queryRunner.query(`DROP TABLE "provider_profiles"`);
    await queryRunner.query(
      `DROP TYPE "public"."provider_profiles_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_775459fc9f92c6826f0e4ebc62"`,
    );
    await queryRunner.query(`DROP TABLE "documents"`);
    await queryRunner.query(`DROP TYPE "public"."documents_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_55b7acbf80551e7fa2b5a33ed6"`,
    );
    await queryRunner.query(`DROP TABLE "skills"`);
  }
}
