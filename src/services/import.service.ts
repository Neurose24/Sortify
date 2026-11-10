import { Prisma, type PackageCondition } from "../../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  ImportRowIssue,
  ParsedImportWorkbook,
} from "@/validators/import.validator";

type ImportResult = {
  rowsRead: number;
  created: number;
  updated: number;
  skipped: number;
  conflicts: number;
  invalid: number;
  unknownPrefix: number;
  invalidRows: ImportRowIssue[];
  conflictRows: ImportRowIssue[];
  unknownPrefixRows: Array<{
    rowNumber: number;
    orderNumber: string;
    barcode: string;
  }>;
};

type WorkingPackage = {
  kind: "existing" | "new";
  key: string;
  orderNumber: string;
  barcode: string | null;
  expeditionId: string | null;
  statusPaket: PackageCondition;
  sourceRowNumber: number;
  createdData?: {
    storeId: string;
    createdById: string;
    nomorPesanan: string;
    barcode: string | null;
    expeditionId: string | null;
    statusPaket: PackageCondition;
  };
};

type PlannedUpdate = {
  id: string;
  barcode: string;
  expeditionId: string | null;
  statusPaket: PackageCondition;
  orderNumber: string;
  rowNumber: number;
};

export class ImportStoreNotFoundError extends Error {
  constructor() {
    super("Toko tidak ditemukan atau bukan milik akun Seller ini.");
    this.name = "ImportStoreNotFoundError";
  }
}

export class ImportConflictError extends Error {
  constructor() {
    super(
      "Data paket berubah selama proses import. Tidak ada perubahan yang disimpan; periksa file lalu coba kembali.",
    );
    this.name = "ImportConflictError";
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
): string | null {
  const matchingExpeditions = new Set(
    rules
      .filter(
        (rule) =>
          (rule.awalan === null || barcode.startsWith(rule.awalan)) &&
          (rule.akhiran === null || barcode.endsWith(rule.akhiran)) &&
          (rule.panjang === null || barcode.length === rule.panjang),
      )
      .map((rule) => rule.expeditionId),
  );

  return matchingExpeditions.size === 1
    ? matchingExpeditions.values().next().value ?? null
    : null;
}

function updatedCondition(
  current: PackageCondition,
  expeditionId: string | null,
): PackageCondition {
  if (
    expeditionId === null &&
    current === "NORMAL"
  ) {
    return "PREFIX_TIDAK_DIKENAL";
  }

  if (
    expeditionId !== null &&
    current === "PREFIX_TIDAK_DIKENAL"
  ) {
    return "NORMAL";
  }

  return current;
}

export async function importPackagesForSeller({
  sellerId,
  storeId,
  workbook,
}: {
  sellerId: string;
  storeId: string;
  workbook: ParsedImportWorkbook;
}): Promise<ImportResult> {
  const result: ImportResult = {
    rowsRead: workbook.rowsRead,
    created: 0,
    updated: 0,
    skipped: 0,
    conflicts: 0,
    invalid: workbook.invalidRows.length,
    unknownPrefix: 0,
    invalidRows: workbook.invalidRows,
    conflictRows: [],
    unknownPrefixRows: [],
  };

  try {
    const planned = await prisma.$transaction(
      async (transaction) => {
        const store = await transaction.store.findFirst({
          where: { id: storeId, sellerId },
          select: { id: true },
        });

        if (!store) {
          throw new ImportStoreNotFoundError();
        }

        if (workbook.rows.length === 0) {
          return {
            creates: [],
            updates: [],
            unknownPrefixRows: [],
          };
        }

        const orderNumbers = [...new Set(workbook.rows.map((row) => row.orderNumber))];
        const barcodes = [
          ...new Set(
            workbook.rows.flatMap((row) =>
              row.barcode === null ? [] : [row.barcode],
            ),
          ),
        ];

        const [existingOrders, existingBarcodes, prefixRules] = await Promise.all([
          transaction.package.findMany({
            where: {
              storeId,
              nomorPesanan: { in: orderNumbers },
            },
            select: {
              id: true,
              nomorPesanan: true,
              barcode: true,
              expeditionId: true,
              statusPaket: true,
            },
          }),
          barcodes.length === 0
            ? Promise.resolve([])
            : transaction.package.findMany({
                where: { barcode: { in: barcodes } },
                select: {
                  id: true,
                  storeId: true,
                  nomorPesanan: true,
                  barcode: true,
                  expeditionId: true,
                  statusPaket: true,
                },
              }),
          transaction.prefixRule.findMany({
            select: {
              expeditionId: true,
              awalan: true,
              akhiran: true,
              panjang: true,
            },
          }),
        ]);

        const workingByOrder = new Map<string, WorkingPackage>();
        const barcodeOwners = new Map<string, string>();

        for (const existing of existingOrders) {
          const key = `existing:${existing.id}`;
          workingByOrder.set(existing.nomorPesanan, {
            kind: "existing",
            key,
            orderNumber: existing.nomorPesanan,
            barcode: existing.barcode,
            expeditionId: existing.expeditionId,
            statusPaket: existing.statusPaket,
            sourceRowNumber: 0,
          });
        }

        for (const existing of existingBarcodes) {
          if (existing.barcode === null) {
            continue;
          }

          barcodeOwners.set(
            existing.barcode,
            `existing:${existing.id}`,
          );
        }

        const createsByOrder = new Map<string, WorkingPackage>();
        const updatesById = new Map<string, PlannedUpdate>();

        for (const row of workbook.rows) {
          const current = workingByOrder.get(row.orderNumber);

          if (!current) {
            if (row.barcode !== null && barcodeOwners.has(row.barcode)) {
              result.conflicts += 1;
              result.conflictRows.push({
                rowNumber: row.rowNumber,
                orderNumber: row.orderNumber,
                reason: "Resi ini sudah digunakan oleh paket lain.",
              });
              continue;
            }

            const expeditionId =
              row.barcode === null
                ? null
                : findUniqueExpedition(row.barcode, prefixRules);
            const statusPaket =
              row.barcode !== null && expeditionId === null
                ? "PREFIX_TIDAK_DIKENAL"
                : "NORMAL";
            const key = `new:${row.orderNumber}`;
            const created: WorkingPackage = {
              kind: "new",
              key,
              orderNumber: row.orderNumber,
              barcode: row.barcode,
              expeditionId,
              statusPaket,
              sourceRowNumber: row.rowNumber,
              createdData: {
                storeId,
                createdById: sellerId,
                nomorPesanan: row.orderNumber,
                barcode: row.barcode,
                expeditionId,
                statusPaket,
              },
            };

            workingByOrder.set(row.orderNumber, created);
            createsByOrder.set(row.orderNumber, created);

            if (row.barcode !== null) {
              barcodeOwners.set(row.barcode, key);
            }
            continue;
          }

          if (current.barcode === row.barcode || row.barcode === null) {
            result.skipped += 1;
            continue;
          }

          if (current.barcode !== null) {
            result.conflicts += 1;
            result.conflictRows.push({
              rowNumber: row.rowNumber,
              orderNumber: row.orderNumber,
              reason: "Nomor pesanan ini sudah memiliki resi yang berbeda.",
            });
            continue;
          }

          const barcodeOwner = barcodeOwners.get(row.barcode);
          if (barcodeOwner && barcodeOwner !== current.key) {
            result.conflicts += 1;
            result.conflictRows.push({
              rowNumber: row.rowNumber,
              orderNumber: row.orderNumber,
              reason: "Resi ini sudah digunakan oleh paket lain.",
            });
            continue;
          }

          const expeditionId = findUniqueExpedition(row.barcode, prefixRules);
          const statusPaket = updatedCondition(
            current.statusPaket,
            expeditionId,
          );

          current.barcode = row.barcode;
          current.expeditionId = expeditionId;
          current.statusPaket = statusPaket;
          current.sourceRowNumber = row.rowNumber;
          barcodeOwners.set(row.barcode, current.key);

          if (current.kind === "new") {
            current.createdData!.barcode = row.barcode;
            current.createdData!.expeditionId = expeditionId;
            current.createdData!.statusPaket = statusPaket;
          } else {
            updatesById.set(current.key.slice("existing:".length), {
              id: current.key.slice("existing:".length),
              barcode: row.barcode,
              expeditionId,
              statusPaket,
              orderNumber: row.orderNumber,
              rowNumber: row.rowNumber,
            });
          }
        }

        for (const update of updatesById.values()) {
          const updated = await transaction.package.updateMany({
            where: { id: update.id, barcode: null },
            data: {
              barcode: update.barcode,
              expeditionId: update.expeditionId,
              statusPaket: update.statusPaket,
            },
          });

          if (updated.count !== 1) {
            throw new ImportConflictError();
          }
        }

        const creates = [...createsByOrder.values()].flatMap((item) =>
          item.createdData ? [item.createdData] : [],
        );

        if (creates.length > 0) {
          await transaction.package.createMany({ data: creates });
        }

        return {
          creates,
          updates: [...updatesById.values()],
          unknownPrefixRows: [
            ...[...createsByOrder.values()]
              .filter(
                (item) =>
                  item.barcode !== null && item.expeditionId === null,
              )
              .map((item) => ({
                rowNumber: item.sourceRowNumber,
                orderNumber: item.orderNumber,
                barcode: item.barcode!,
              })),
            ...[...updatesById.values()]
              .filter((item) => item.expeditionId === null)
              .map((item) => ({
                rowNumber: item.rowNumber,
                orderNumber: item.orderNumber,
                barcode: item.barcode,
              })),
          ],
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 60_000,
      },
    );

    result.created = planned.creates.length;
    result.updated = planned.updates.length;
    result.unknownPrefixRows = planned.unknownPrefixRows;
    result.unknownPrefix = planned.unknownPrefixRows.length;

    return result;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2034")
    ) {
      throw new ImportConflictError();
    }

    throw error;
  }
}