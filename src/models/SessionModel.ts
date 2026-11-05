import { prisma } from "@/lib/prisma";

export async function createSessionRecord(data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  return prisma.session.create({
    data,
  });
}

export async function findValidSession(tokenHash: string) {
  return prisma.session.findFirst({
    where: {
      tokenHash,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          nama: true,
          username: true,
          role: true,
        },
      },
    },
  });
}

export async function deleteSessionByTokenHash(tokenHash: string) {
  return prisma.session.deleteMany({
    where: { tokenHash },
  });
}

export async function deleteAllUserSessions(userId: string) {
  return prisma.session.deleteMany({
    where: { userId },
  });
}

export async function deleteExpiredSessions() {
  return prisma.session.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });
}