import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/services/password.service";
import type { PasswordChangeInput } from "@/validators/password-change.validator";

export class InvalidCurrentPasswordError extends Error {
  constructor() {
    super("Password saat ini tidak sesuai.");
    this.name = "InvalidCurrentPasswordError";
  }
}

export class ReusedPasswordError extends Error {
  constructor() {
    super("Password baru harus berbeda dari password saat ini.");
    this.name = "ReusedPasswordError";
  }
}

export class ConcurrentPasswordChangeError extends Error {
  constructor() {
    super("Password berubah selama permintaan diproses. Silakan coba kembali.");
    this.name = "ConcurrentPasswordChangeError";
  }
}

export async function changeUserPassword(
  userId: string,
  currentSessionId: string,
  input: PasswordChangeInput,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user || !(await verifyPassword(user.password, input.currentPassword))) {
    throw new InvalidCurrentPasswordError();
  }

  if (await verifyPassword(user.password, input.newPassword)) {
    throw new ReusedPasswordError();
  }

  const password = await hashPassword(input.newPassword);
  await prisma.$transaction(async (transaction) => {
    const updated = await transaction.user.updateMany({
      where: { id: userId, password: user.password },
      data: { password },
    });

    if (updated.count !== 1) {
      throw new ConcurrentPasswordChangeError();
    }

    await transaction.session.deleteMany({
      where: {
        userId,
        id: { not: currentSessionId },
      },
    });
  });
}
