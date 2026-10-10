import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@everestmills.test").trim().toLowerCase();
  const rawPassword = process.env.ADMIN_PASSWORD;

  if (!rawPassword) {
    console.error("Error: ADMIN_PASSWORD environment variable is required.");
    process.exit(1);
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(rawPassword, saltRounds);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name: "System Administrator",
      passwordHash,
      role: Role.ADMIN,
      active: true,
    },
    create: {
      email,
      name: "System Administrator",
      passwordHash,
      role: Role.ADMIN,
      active: true,
    },
  });

  console.log(`✓ Admin user successfully configured: ${admin.email} (Role: ${admin.role})`);
}

main()
  .catch((e) => {
    console.error("Failed to create admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
