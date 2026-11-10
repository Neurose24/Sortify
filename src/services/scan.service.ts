import {
  Prisma,
  type PackageCondition,
  type ScanResult,
  type SecurityStatus,
} from "../../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  findPackagesNeedingPetugasAttention,
  findRecentScansForUser,
  findScanHistoryForAdmin,
  findScanHistoryForUser,
  findTodayScanCounts,
} from "@/models/ScanHistoryModel";
import type { ParsedScanInput } from "@/validators/scan.validator";

type ScanResultRecord = {
  id: string;
  barcode: string;
  result: ScanResult;
  message: string;
  scannedAt: string;
  package: null | {
    id: string;
    nomorPesanan: string;
    statusScan: "BELUM_DISCAN" | "SUDAH_DISCAN";
    statusPaket: PackageCondition;
    statusPengamanan: SecurityStatus;
    store: string;
    marketplace: string;
    expedition: string | null;
    createdBy: string | null;
  };
};

function getJakartaDayBounds(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );
  const dayStart = new Date(
    Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      -7,
    ),
  );

  return {
    start: dayStart,
    end: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000),
  };
}

function getPrefixMatch(
  barcode: string,
  rules: Array<{
    expeditionId: string;
    awalan: string | null;
    akhiran: string | null;
    panjang: number | null;
  }>,
) {
  const expeditionIds = new Set(
    rules
      .filter(
        (rule) =>
          (rule.awalan === null || barcode.startsWith(rule.awalan)) &&
          (rule.akhiran === null || barcode.endsWith(rule.akhiran)) &&
          (rule.panjang === null || barcode.length === rule.panjang),
      )
      .map((rule) => rule.expeditionId),
  );

  return expeditionIds.size === 1
    ? expeditionIds.values().next().value ?? null
    : null;
}

class ScanConcurrencyError extends Error {}

async function scanPackageAttempt(
  userId: string,
  input: ParsedScanInput,
  attempt: number,
): Promise<ScanResultRecord> {
  const barcode = input.barcode.trim();

  try {
    return await prisma.$transaction(
      async (transaction) => {
        const found = await transaction.package.findUnique({
          where: { barcode },
          select: {
            id: true,
            nomorPesanan: true,
            barcode: true,
            statusScan: true,
            statusPaket: true,
            statusPengamanan: true,
            expeditionId: true,
            updatedAt: true,
            store: {
              select: {
                nama: true,
                marketplace: { select: { nama: true } },
              },
            },
            expedition: { select: { nama: true } },
            createdBy: { select: { nama: true } },
          },
        });

        if (!found) {
          const history = await transaction.scanHistory.create({
            data: {
              userId,
              barcode,
              hasilScan: "BARCODE_TIDAK_DIKENAL",
              keterangan: "Barcode tidak terdaftar sebagai paket.",
            },
            select: { id: true, scannedAt: true },
          });

          return {
            id: history.id,
            barcode,
            result: "BARCODE_TIDAK_DIKENAL",
            message: "Barcode belum terdaftar sebagai paket.",
            scannedAt: history.scannedAt.toISOString(),
            package: null,
          };
        }

        let packageStatus = found.statusPaket;
        let securityStatus = found.statusPengamanan;
        let statusScan = found.statusScan;
        let expeditionName = found.expedition?.nama ?? null;
        let result: ScanResult;
        let message: string;
        let updateData:
          | {
              statusPaket?: PackageCondition;
              statusPengamanan?: SecurityStatus;
              statusScan?: "SUDAH_DISCAN";
              expeditionId?: string;
            }
          | null = null;

        if (packageStatus === "PENDING") {
          result = "PAKET_PENDING";
          message = "Paket berstatus pending dan perlu diamankan.";
          securityStatus = "PERLU_DIAMANKAN";
          updateData = { statusPengamanan: securityStatus };
        } else if (packageStatus === "BATAL") {
          result = "PAKET_BATAL";
          message = "Paket berstatus batal dan perlu diamankan.";
          securityStatus = "PERLU_DIAMANKAN";
          updateData = { statusPengamanan: securityStatus };
        } else if (packageStatus === "DUPLIKAT") {
          result = "PAKET_DUPLIKAT";
          message = "Paket teridentifikasi duplikat dan perlu diamankan.";
          securityStatus = "PERLU_DIAMANKAN";
          updateData = { statusPengamanan: securityStatus };
        } else if (packageStatus === "PREFIX_TIDAK_DIKENAL") {
          const rules = await transaction.prefixRule.findMany({
            select: {
              expeditionId: true,
              awalan: true,
              akhiran: true,
              panjang: true,
              expedition: { select: { nama: true } },
            },
          });
          const matchedExpeditionId = getPrefixMatch(barcode, rules);

          if (matchedExpeditionId === null) {
            result = "PREFIX_TIDAK_DIKENAL";
            message =
              "Prefix belum cocok dengan tepat satu ekspedisi. Periksa aturan prefix.";
          } else {
            expeditionName =
              rules.find((rule) => rule.expeditionId === matchedExpeditionId)
                ?.expedition.nama ?? null;
            packageStatus = "NORMAL";
            updateData = {
              statusPaket: packageStatus,
              expeditionId: matchedExpeditionId,
            };

            if (statusScan === "SUDAH_DISCAN") {
              result = "SUDAH_PERNAH_DISCAN";
              message = "Paket sudah pernah berhasil dipindai sebelumnya.";
            } else {
              result = "BERHASIL";
              message = "Scan berhasil. Paket siap disortir.";
              statusScan = "SUDAH_DISCAN";
              updateData.statusScan = statusScan;
            }
          }
        } else if (statusScan === "SUDAH_DISCAN") {
          result = "SUDAH_PERNAH_DISCAN";
          message = "Paket sudah pernah berhasil dipindai sebelumnya.";
        } else {
          result = "BERHASIL";
          message = "Scan berhasil. Paket siap disortir.";
          statusScan = "SUDAH_DISCAN";
          updateData = { statusScan };
        }

        if (updateData) {
          const updated = await transaction.package.updateMany({
            where: {
              id: found.id,
              statusScan: found.statusScan,
              statusPaket: found.statusPaket,
            },
            data: updateData,
          });

          if (updated.count !== 1) {
            throw new ScanConcurrencyError(
              "Paket berubah selama proses pemindaian.",
            );
          }
        }

        const history = await transaction.scanHistory.create({
          data: {
            userId,
            packageId: found.id,
            barcode,
            hasilScan: result,
            statusPaket: packageStatus,
            statusPengamanan: securityStatus,
            keterangan: message,
          },
          select: { id: true, scannedAt: true },
        });

        return {
          id: history.id,
          barcode,
          result,
          message,
          scannedAt: history.scannedAt.toISOString(),
          package: {
            id: found.id,
            nomorPesanan: found.nomorPesanan,
            statusScan,
            statusPaket: packageStatus,
            statusPengamanan: securityStatus,
            store: found.store.nama,
            marketplace: found.store.marketplace.nama,
            expedition: expeditionName,
            createdBy: found.createdBy?.nama ?? null,
          },
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 15_000,
      },
    );
  } catch (processingError) {
    const retryable =
      processingError instanceof ScanConcurrencyError ||
      (processingError instanceof Prisma.PrismaClientKnownRequestError &&
        processingError.code === "P2034");

    if (retryable && attempt === 0) {
      return scanPackageAttempt(userId, { barcode }, 1);
    }

    try {
      const history = await prisma.scanHistory.create({
        data: {
          userId,
          barcode,
          hasilScan: "GAGAL",
          keterangan: "Pemrosesan scan gagal; coba lagi atau hubungi Admin.",
        },
        select: { id: true, scannedAt: true },
      });

      return {
        id: history.id,
        barcode,
        result: "GAGAL",
        message: "Pemrosesan scan gagal. Percobaan telah dicatat; silakan coba lagi.",
        scannedAt: history.scannedAt.toISOString(),
        package: null,
      };
    } catch (historyError) {
      throw new AggregateError(
        [processingError, historyError],
        "Pemrosesan scan dan pencatatan riwayat sama-sama gagal.",
      );
    }
  }
}

export function scanPackage(
  userId: string,
  input: ParsedScanInput,
): Promise<ScanResultRecord> {
  return scanPackageAttempt(userId, input, 0);
}

export async function getScanDashboard(userId: string) {
  const { start, end } = getJakartaDayBounds(new Date());
  const [counts, recent, attention] = await Promise.all([
    findTodayScanCounts(userId, start, end),
    findRecentScansForUser(userId),
    findPackagesNeedingPetugasAttention(userId),
  ]);
  const total = counts.reduce((sum, item) => sum + item._count._all, 0);
  const success =
    counts.find((item) => item.hasilScan === "BERHASIL")?._count._all ?? 0;

  return {
    today: { total, success, other: total - success },
    recent: recent.map((item) => ({
      ...item,
      scannedAt: item.scannedAt.toISOString(),
    })),
    attention,
  };
}

export function getScanHistory(userId: string, isAdmin: true): ReturnType<typeof findScanHistoryForAdmin>;
export function getScanHistory(userId: string, isAdmin: false): ReturnType<typeof findScanHistoryForUser>;
export async function getScanHistory(userId: string, isAdmin: boolean) {
  if (isAdmin) {
    return findScanHistoryForAdmin();
  }

  return findScanHistoryForUser(userId);
}