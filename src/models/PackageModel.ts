import { prisma } from "@/lib/prisma";

const packageListSelect = {
  id: true,
  storeId: true,
  nomorPesanan: true,
  barcode: true,
  statusScan: true,
  statusPaket: true,
  statusPengamanan: true,
  createdAt: true,
  updatedAt: true,
  store: {
    select: {
      nama: true,
      sellerId: true,
      marketplace: {
        select: {
          nama: true,
        },
      },
    },
  },
  expedition: {
    select: {
      nama: true,
    },
  },
  createdBy: {
    select: {
      nama: true,
    },
  },
} as const;

export function findPackagesForAdmin() {
  return prisma.package.findMany({
    select: packageListSelect,
    orderBy: { createdAt: "desc" },
  });
}

export function findPackagesForSeller(sellerId: string) {
  return prisma.package.findMany({
    where: {
      store: { sellerId },
    },
    select: packageListSelect,
    orderBy: { createdAt: "desc" },
  });
}