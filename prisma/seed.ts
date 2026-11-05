import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import argon2 from "argon2";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const nama = process.env.ADMIN_NAME?.trim();
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!connectionString || !nama || !username || !password) {
    throw new Error(
      "DATABASE_URL, ADMIN_NAME, ADMIN_USERNAME, dan ADMIN_PASSWORD wajib diisi."
    );
  }

  if (password.length < 12) {
    throw new Error("Password Admin minimal 12 karakter.");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new Error(
        "Username tersebut sudah digunakan. Seed dibatalkan tanpa mengubah akun."
      );
    }

    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    await prisma.user.create({
      data: {
        nama,
        username,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log("Akun Admin Sortify berhasil dibuat.");
    console.log(`Username: ${username}`);
    console.log("Password tidak ditampilkan demi keamanan.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Gagal membuat akun Admin:", error);
  process.exitCode = 1;
});