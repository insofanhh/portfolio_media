import "dotenv/config";
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 12 || password.length > 256 || password === "set-a-strong-password-before-seeding") throw new Error("Set valid ADMIN_EMAIL and a unique ADMIN_PASSWORD (12–256 characters) in your environment.");
  const existing = await db.user.findUnique({ where: { email } });
  if (existing && !process.argv.includes("--reset-password")) { console.log("Admin exists; credentials were not changed."); return; }
  const passwordHash = hashPassword(password);
  await db.$transaction(async tx => {
    const user = await tx.user.upsert({ where: { email }, create: { email, passwordHash, name: "Portfolio Owner" }, update: { passwordHash } });
    await tx.session.deleteMany({ where: { userId: user.id } });
  });
  console.log(existing ? "Admin password updated; previous sessions revoked." : "Admin created. Credentials remain in your environment.");
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Could not create admin"); process.exitCode = 1; }).finally(() => db.$disconnect());
