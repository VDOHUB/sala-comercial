import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email    = process.env.ADMIN_EMAIL    || "admin@viverdeobra.com";
  const password = process.env.ADMIN_PASSWORD || "Admin@2026";
  const name     = process.env.ADMIN_NAME     || "Administrador";

  const hash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.upsert({
    where:  { email },
    update: { password: hash, name },
    create: { email, password: hash, name },
  });

  console.log(`✅ Admin criado: ${admin.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
