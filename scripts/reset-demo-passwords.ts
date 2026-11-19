/**
 * Sets the two accounts behind the "Demo user" / "Demo admin" login buttons to the public demo password.
 *   npm run db:demo-passwords
 *
 * Only touches the accounts listed in DEMO_ACCOUNTS. Never run this against a database whose demo
 * accounts hold real data you care about: the password is public.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEMO_ACCOUNTS } from "../src/lib/constants";

if (!process.env.DATABASE_URL) {
  console.error("Set DATABASE_URL in .env.local first.");
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  for (const a of DEMO_ACCOUNTS) {
    const hash = await bcrypt.hash(a.password, 10);
    const res = await db.user.updateMany({ where: { email: a.email }, data: { passwordHash: hash } });
    console.log(res.count ? `✓ ${a.email}` : `– ${a.email} not found (run npm run db:seed first)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
