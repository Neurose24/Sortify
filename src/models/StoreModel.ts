import { prisma } from "@/lib/prisma";

export function findAllStores() {
  return prisma.store.findMany({
    select: {
      id: true,
      nama: true,
      sellerId: true,
      marketplace: { select: { nama: true } },
    },
    orderBy: [{ nama: "asc" }, { id: "asc" }],
  });
}

export function findStoresForSeller(sellerId: string) {
  return prisma.store.findMany({
    where: { sellerId },
    select: {
      id: true,
      nama: true,
      sellerId: true,
      marketplace: {
        select: {
          nama: true,
        },
      },
    },
    orderBy: [{ nama: "asc" }, { id: "asc" }],
  });
}