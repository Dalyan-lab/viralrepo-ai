// Crée / met à jour le compte administrateur.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "technodalyan@gmail.com";
const ADMIN_PASSWORD = "Mila_Viral2027";

const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

await prisma.user.upsert({
  where: { email: ADMIN_EMAIL },
  update: { role: "admin", password: hash },
  create: {
    email: ADMIN_EMAIL,
    name: "Techno Dalyan",
    password: hash,
    role: "admin",
    provider: "credentials",
  },
});

console.log(`✔ Compte admin prêt : ${ADMIN_EMAIL}`);
await prisma.$disconnect();
