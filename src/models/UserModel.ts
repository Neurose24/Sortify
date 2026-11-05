import { prisma } from "@/lib/prisma";

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  });
}

export async function findPublicUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      nama: true,
      username: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}