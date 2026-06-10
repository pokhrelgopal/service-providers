import { MigrationInterface, QueryRunner } from 'typeorm';

const SKILLS: Array<[slug: string, name: string]> = [
  ['electrician', 'Electrician'],
  ['plumber', 'Plumber'],
  ['carpenter', 'Carpenter'],
  ['painter', 'Painter'],
  ['mechanic', 'Mechanic'],
  ['welder', 'Welder'],
  ['mason', 'Mason'],
  ['ac-refrigeration', 'AC & Refrigeration Technician'],
  ['appliance-repair', 'Appliance Repair'],
  ['house-cleaning', 'House Cleaning'],
  ['gardener', 'Gardener / Landscaper'],
  ['pest-control', 'Pest Control'],
  ['mover-packer', 'Mover & Packer'],
  ['locksmith', 'Locksmith'],
  ['cctv-installer', 'CCTV / Security Installer'],
  ['electronics-repair', 'Electronics Repair'],
  ['computer-repair', 'Computer & Mobile Repair'],
  ['tailor', 'Tailor'],
  ['cook', 'Cook / Chef'],
  ['beautician', 'Beautician'],
  ['barber', 'Barber / Hairdresser'],
  ['driver', 'Driver'],
  ['tutor', 'Tutor'],
  ['photographer', 'Photographer'],
];

export class SeedSkills1781101500000 implements MigrationInterface {
  name = 'SeedSkills1781101500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (let i = 0; i < SKILLS.length; i++) {
      const [slug, name] = SKILLS[i];
      await queryRunner.query(
        `INSERT INTO "skills" ("slug", "name", "sortOrder") VALUES ($1, $2, $3)
         ON CONFLICT ("slug") DO NOTHING`,
        [slug, name, i],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const slugs = SKILLS.map((s) => s[0]);
    await queryRunner.query(`DELETE FROM "skills" WHERE "slug" = ANY($1)`, [
      slugs,
    ]);
  }
}
