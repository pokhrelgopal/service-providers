import 'reflect-metadata';
import { In } from 'typeorm';
import AppDataSource from './data-source';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';
import { Skill } from '../skills/skill.entity';
import { ProviderProfile } from '../providers/provider-profile.entity';
import { ProviderStatus } from '../providers/provider-status.enum';

/**
 * Idempotent demo dataset: a handful of approved, located providers (with
 * skills + ratings) around Kathmandu so discovery/broadcast has content, plus a
 * demo seeker. Re-running skips anything already present.
 *
 *   npm run seed:demo
 */
interface DemoProvider {
  email: string;
  name: string;
  lat: number;
  lng: number;
  skills: string[];
  ratingCount: number;
  ratingSum: number;
  description: string;
}

const DEMO_PROVIDERS: DemoProvider[] = [
  {
    email: 'demo.bikash@servio.local',
    name: 'Bikash Thapa',
    lat: 27.715,
    lng: 85.328,
    skills: ['electrician', 'appliance-repair'],
    ratingCount: 12,
    ratingSum: 58,
    description: 'Licensed electrician, 8 years. Wiring, outlets, fixtures.',
  },
  {
    email: 'demo.sita@servio.local',
    name: 'Sita Gurung',
    lat: 27.705,
    lng: 85.315,
    skills: ['plumber'],
    ratingCount: 8,
    ratingSum: 36,
    description: 'Plumbing repairs, leaks, fittings — quick and tidy.',
  },
  {
    email: 'demo.ramesh@servio.local',
    name: 'Ramesh K.C.',
    lat: 27.72,
    lng: 85.34,
    skills: ['carpenter', 'painter'],
    ratingCount: 20,
    ratingSum: 98,
    description: 'Carpentry & painting. Furniture, doors, interior finishing.',
  },
  {
    email: 'demo.anita@servio.local',
    name: 'Anita Shrestha',
    lat: 27.69,
    lng: 85.31,
    skills: ['house-cleaning'],
    ratingCount: 5,
    ratingSum: 21,
    description: 'Deep cleaning for homes and offices.',
  },
  {
    email: 'demo.hari@servio.local',
    name: 'Hari Lama',
    lat: 27.71,
    lng: 85.33,
    skills: ['electrician'],
    ratingCount: 0,
    ratingSum: 0,
    description: 'New on Servio — electrical work, fair rates.',
  },
  {
    email: 'demo.maya@servio.local',
    name: 'Maya Tamang',
    lat: 27.7,
    lng: 85.345,
    skills: ['ac-refrigeration', 'electronics-repair'],
    ratingCount: 15,
    ratingSum: 70,
    description: 'AC, fridge and electronics repair specialist.',
  },
];

async function run(): Promise<void> {
  const ds = await AppDataSource.initialize();
  const users = ds.getRepository(User);
  const profiles = ds.getRepository(ProviderProfile);
  const skills = ds.getRepository(Skill);

  let created = 0;
  let skipped = 0;

  for (const d of DEMO_PROVIDERS) {
    const existing = await users.findOne({ where: { email: d.email } });
    if (existing) {
      skipped++;
      continue;
    }
    const user = await users.save(
      users.create({
        email: d.email,
        name: d.name,
        roles: [UserRole.PROVIDER],
        avatarUrl: null,
      }),
    );
    const skillEntities = await skills.findBy({ slug: In(d.skills) });
    const profile = profiles.create({
      userId: user.id,
      status: ProviderStatus.APPROVED,
      isAvailable: true,
      latitude: d.lat,
      longitude: d.lng,
      serviceDescription: d.description,
      ratingCount: d.ratingCount,
      ratingSum: d.ratingSum,
      skills: skillEntities,
      submittedAt: new Date(),
      reviewedAt: new Date(),
    });
    await profiles.save(profile);
    created++;

    console.log(`+ provider ${d.name} (${skillEntities.length} skills)`);
  }

  // Demo seeker
  const seekerEmail = 'demo.seeker@servio.local';
  if (!(await users.findOne({ where: { email: seekerEmail } }))) {
    await users.save(
      users.create({
        email: seekerEmail,
        name: 'Demo Seeker',
        roles: [UserRole.SEEKER],
        avatarUrl: null,
      }),
    );
    created++;

    console.log('+ seeker Demo Seeker');
  } else {
    skipped++;
  }

  console.log(`Demo seed complete — ${created} created, ${skipped} skipped.`);
  await ds.destroy();
}

run().catch((err) => {
  console.error('Demo seed failed:', err);
  process.exit(1);
});
