import { Prisma, type PackageCondition } from "../../generated/prisma/client";
import { prisma } from "@/lib/prisma";

const problemConditions: PackageCondition[] = [
  "PENDING",
  "BATAL",
  "DUPLIKAT",
];

export class PackageNotFoundError extends Error {
  constructor() {
    super("Paket tidak ditemukan atau tidak dapat diakses.");
    this.name = "PackageNotFoundError";
  }
}

export class PackageUpdateConflictError extends Error {
  constructor(message = "Paket berubah sebelum pembaruan selesai. Muat ulang lalu coba lagi.") {
    super(message);
    this.name = "PackageUpdateConflictError";
  }
}

export class InvalidPackageActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPackageActionError";
  }
}

function findUniqueExpedition(
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

export async function updatePackageCondition(
  packageId: string,
  condition: PackageCondition,
) {
  try {
    return await prisma.$transaction(async (transaction) => {
      const current = await transaction.package.findUnique({
        where: { id: packageId },
        select: {
          id: true,
          statusPaket: true,
          statusPengamanan: true,
          expeditionId: true,
          barcode: true,
        },
      });

      if (!current) {
        throw new PackageNotFoundError();
      }

      let expeditionId = current.expeditionId;
      if (
        condition === "NORMAL" &&
        current.statusPaket === "PREFIX_TIDAK_DIKENAL" &&
        current.barcode
      ) {
        const rules = await transaction.prefixRule.findMany({
          select: {
            expeditionId: true,
            awalan: true,
            akhiran: true,
            panjang: true,
          },
        });
        expeditionId = findUniqueExpedition(current.barcode, rules);

        if (expeditionId === null) {
          throw new InvalidPackageActionError(
            "Kondisi tidak dapat dipulihkan ke NORMAL sebelum resi cocok dengan tepat satu aturan prefix.",
          );
        }
      }

      const updated = await transaction.package.updateMany({
        where: {
          id: packageId,
          statusPaket: current.statusPaket,
          statusPengamanan: current.statusPengamanan,
          expeditionId: current.expeditionId,
        },
        data: {
          statusPaket: condition,
          ...(problemConditions.includes(condition)
            ? { statusPengamanan: "PERLU_DIAMANKAN" as const }
            : {}),
          ...(condition === "NORMAL" &&
          problemConditions.includes(current.statusPaket)
            ? { statusPengamanan: "TIDAK_PERLU" as const }
            : {}),
          ...(condition === "NORMAL" &&
          current.statusPaket === "PREFIX_TIDAK_DIKENAL"
            ? { expeditionId }
            : {}),
          ...(condition === "PREFIX_TIDAK_DIKENAL"
            ? { expeditionId: null }
            : {}),
        },
      });

      if (updated.count !== 1) {
        throw new PackageUpdateConflictError();
      }

      return {
        statusPaket: condition,
        statusPengamanan: problemConditions.includes(condition)
          ? ("PERLU_DIAMANKAN" as const)
          : condition === "NORMAL" &&
              problemConditions.includes(current.statusPaket)
            ? ("TIDAK_PERLU" as const)
          : current.statusPengamanan,
        expeditionId,
      };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      throw new PackageUpdateConflictError();
    }

    throw error;
  }
}

export async function addBarcodeForSeller(
  packageId: string,
  sellerId: string,
  rawBarcode: string,
) {
  const barcode = rawBarcode.trim();

  if (!barcode) {
    throw new InvalidPackageActionError("Resi wajib diisi.");
  }

  try {
    return await prisma.$transaction(
      async (transaction) => {
        const current = await transaction.package.findFirst({
          where: {
            id: packageId,
            store: { sellerId },
          },
          select: {
            id: true,
            barcode: true,
            statusPaket: true,
          },
        });

        if (!current) {
          throw new PackageNotFoundError();
        }

        if (current.barcode !== null) {
          throw new PackageUpdateConflictError(
            "Resi paket ini sudah terisi dan tidak dapat ditimpa.",
          );
        }

        const rules = await transaction.prefixRule.findMany({
          select: {
            expeditionId: true,
            awalan: true,
            akhiran: true,
            panjang: true,
          },
        });
        const expeditionId = findUniqueExpedition(barcode, rules);
        const nextCondition =
          current.statusPaket === "PREFIX_TIDAK_DIKENAL" &&
          expeditionId !== null
            ? "NORMAL"
            : current.statusPaket === "NORMAL" && expeditionId === null
              ? "PREFIX_TIDAK_DIKENAL"
              : current.statusPaket;
        const updated = await transaction.package.updateMany({
          where: {
            id: packageId,
            barcode: null,
            statusPaket: current.statusPaket,
          },
          data: {
            barcode,
            expeditionId,
            statusPaket: nextCondition,
          },
        });

        if (updated.count !== 1) {
          throw new PackageUpdateConflictError(
            "Resi paket berubah saat disimpan. Muat ulang lalu periksa paket.",
          );
        }

        return {
          barcode,
          expeditionId,
          statusPaket: nextCondition,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 15_000,
      },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new PackageUpdateConflictError(
        "Resi ini sudah digunakan oleh paket lain.",
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      throw new PackageUpdateConflictError();
    }

    throw error;
  }
}

export async function markPackageSecured(
  packageId: string,
) {
  const result = await prisma.package.updateMany({
    where: {
      id: packageId,
      statusPengamanan: "PERLU_DIAMANKAN",
      statusPaket: { in: problemConditions },
    },
    data: { statusPengamanan: "SUDAH_DIAMANKAN" },
  });

  if (result.count !== 1) {
    throw new PackageUpdateConflictError(
      "Paket tidak lagi memerlukan pengamanan atau sudah diperbarui. Muat ulang halaman.",
    );
  }

  return { statusPengamanan: "SUDAH_DIAMANKAN" as const };
}
