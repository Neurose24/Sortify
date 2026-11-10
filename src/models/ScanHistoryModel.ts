import { prisma } from "@/lib/prisma";

export function findScanHistoryForUser(
  userId: string,
  limit = 100,
) {
  return prisma.scanHistory.findMany({
    where: { userId },
    select: {
      id: true,
      barcode: true,
      hasilScan: true,
      statusPaket: true,
      statusPengamanan: true,
      keterangan: true,
      scannedAt: true,
      package: {
        select: {
          nomorPesanan: true,
          store: {
            select: {
              nama: true,
              marketplace: { select: { nama: true } },
            },
          },
          expedition: { select: { nama: true } },
        },
      },
    },
    orderBy: { scannedAt: "desc" },
    take: limit,
  });
}

export function findScanHistoryForAdmin(limit = 200) {
  return prisma.scanHistory.findMany({
    select: {
      id: true,
      barcode: true,
      hasilScan: true,
      statusPaket: true,
      statusPengamanan: true,
      keterangan: true,
      scannedAt: true,
      user: { select: { id: true, nama: true } },
      package: {
        select: {
          nomorPesanan: true,
          store: {
            select: {
              nama: true,
              marketplace: { select: { nama: true } },
            },
          },
          expedition: { select: { nama: true } },
        },
      },
    },
    orderBy: { scannedAt: "desc" },
    take: limit,
  });
}

export function findTodayScanCounts(
  userId: string,
  start: Date,
  end: Date,
) {
  return prisma.scanHistory.groupBy({
    by: ["hasilScan"],
    where: {
      userId,
      scannedAt: { gte: start, lt: end },
    },
    _count: { _all: true },
  });
}

export function findRecentScansForUser(userId: string, limit = 6) {
  return prisma.scanHistory.findMany({
    where: { userId },
    select: {
      id: true,
      barcode: true,
      hasilScan: true,
      keterangan: true,
      scannedAt: true,
      package: {
        select: {
          nomorPesanan: true,
          store: { select: { nama: true } },
        },
      },
    },
    orderBy: { scannedAt: "desc" },
    take: limit,
  });
}

export function findPackagesNeedingPetugasAttention(userId: string) {
  return prisma.package.findMany({
    where: {
      statusPaket: { in: ["PENDING", "BATAL"] },
      statusPengamanan: "PERLU_DIAMANKAN",
      scanHistories: {
        some: {
          userId,
          hasilScan: "BERHASIL",
        },
      },
    },
    select: {
      id: true,
      nomorPesanan: true,
      barcode: true,
      statusPaket: true,
      store: { select: { nama: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
}