/**
 * Development seed.
 *
 * Creates one owner and one gym so the authentication stub (which picks the
 * first user) and tenantGuard have something to work with. Idempotent, so it
 * is safe to run repeatedly.
 *
 * Run with: npm run seed
 */
import { prisma } from "../src/shared/config/prisma.ts";

const owner = await prisma.user.upsert({
  where: { email: "owner@example.com" },
  update: {},
  create: {
    googleId: "dev-google-id-001",
    email: "owner@example.com",
    name: "Dev Gym Owner",
  },
});

const existingGym = await prisma.gym.findFirst({ where: { ownerId: owner.id } });

const gym =
  existingGym ??
  (await prisma.gym.create({
    data: {
      ownerId: owner.id,
      name: "Iron Fitness Gym",
      phone: "919876500000",
      plan: "TRIAL",
      reminderDaysBefore: 3,
    },
  }));

console.log("Seeded:");
console.log(`  user  ${owner.id}  ${owner.email}`);
console.log(`  gym   ${gym.id}  ${gym.name}`);

await prisma.$disconnect();
