import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function findPackageOverview(where: Prisma.PackageWhereInput) {
  const [conditions, scanned, needsSecurity] = await Promise.all([
    prisma.package.groupBy({
      by: ["statusPaket"],
      where,
      _count: { _all: true },
    }),
    prisma.package.count({
      where: { ...where, statusScan: "SUDAH_DISCAN" },
    }),
    prisma.package.count({
      where: { ...where, statusPengamanan: "PERLU_DIAMANKAN" },
    }),
  ]);

  return {
    conditions: conditions.map((item) => ({
      status: item.statusPaket,
      count: item._count._all,
    })),
    total: conditions.reduce((sum, item) => sum + item._count._all, 0),
    scanned,
    needsSecurity,
  };
}

export async function findScanOverview(
  where: Prisma.ScanHistoryWhereInput,
  start: Date | null,
  end: Date | null,
  days: Array<{ start: Date; end: Date }>,
) {
  const periodWhere = {
    ...where,
    ...(start || end
      ? { scannedAt: { ...(start ? { gte: start } : {}), ...(end ? { lt: end } : {}) } }
      : {}),
  } satisfies Prisma.ScanHistoryWhereInput;

  const [results, dailyCounts, recent] = await Promise.all([
    prisma.scanHistory.groupBy({
      by: ["hasilScan"],
      where: periodWhere,
      _count: { _all: true },
    }),
    Promise.all(
      days.map(({ start: dayStart, end: dayEnd }) =>
        prisma.scanHistory.count({
          where: {
            ...where,
            scannedAt: {
              ...(start && dayStart < start ? { gte: start } : { gte: dayStart }),
              ...(end && dayEnd > end ? { lt: end } : { lt: dayEnd }),
            },
          },
        }),
      ),
    ),
    prisma.scanHistory.findMany({
      where: periodWhere,
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
      take: 8,
    }),
  ]);

  return {
    results: results.map((item) => ({
      status: item.hasilScan,
      count: item._count._all,
    })),
    dailyCounts,
    total: results.reduce((sum, item) => sum + item._count._all, 0),
    recent: recent.map((item) => ({
      ...item,
      scannedAt: item.scannedAt.toISOString(),
    })),
  };
}

export function findReportFilterOptions(sellerId?: string) {
  return Promise.all([
    prisma.store.findMany({
      where: sellerId ? { sellerId } : undefined,
      select: {
        id: true,
        nama: true,
        marketplaceId: true,
        marketplace: { select: { nama: true } },
      },
      orderBy: [{ nama: "asc" }, { id: "asc" }],
    }),
    prisma.marketplace.findMany({
      where: sellerId ? { stores: { some: { sellerId } } } : undefined,
      select: { id: true, nama: true },
      orderBy: { nama: "asc" },
    }),
    prisma.expedition.findMany({
      select: { id: true, nama: true },
      orderBy: { nama: "asc" },
    }),
  ]);
}

export function findReportPackages(where: Prisma.PackageWhereInput) {
  return prisma.package.findMany({
    where,
    take: 50_001,
    select: {
      nomorPesanan: true,
      barcode: true,
      statusScan: true,
      statusPaket: true,
      statusPengamanan: true,
      createdAt: true,
      store: {
        select: {
          nama: true,
          marketplace: { select: { nama: true } },
          seller: { select: { nama: true } },
        },
      },
      expedition: { select: { nama: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function findReportDataCounts(
  packageWhere: Prisma.PackageWhereInput,
  scanWhere: Prisma.ScanHistoryWhereInput,
) {
  return Promise.all([
    prisma.package.count({ where: packageWhere }),
    prisma.scanHistory.count({ where: scanWhere }),
  ]);
}

export function findReportScans(where: Prisma.ScanHistoryWhereInput) {
  return prisma.scanHistory.findMany({
    where,
    take: 50_001,
    select: {
      barcode: true,
      hasilScan: true,
      statusPaket: true,
      statusPengamanan: true,
      keterangan: true,
      scannedAt: true,
      user: { select: { nama: true } },
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
  });
}
