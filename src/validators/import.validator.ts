import ExcelJS from "exceljs";

export const MAX_IMPORT_ROWS = 5_000;

export type ParsedImportRow = {
  rowNumber: number;
  orderNumber: string;
  barcode: string | null;
};

export type ImportRowIssue = {
  rowNumber: number;
  orderNumber: string | null;
  reason: string;
};

export type ParsedImportWorkbook = {
  rowsRead: number;
  rows: ParsedImportRow[];
  invalidRows: ImportRowIssue[];
};

export class InvalidImportWorkbookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidImportWorkbookError";
  }
}

function normalizeHeader(value: string): string {
  return value.trim().toLocaleLowerCase("id-ID").replace(/\s+/g, " ");
}

function getIdentifierValue(
  cell: ExcelJS.Cell,
  label: string,
): { value: string | null; error: string | null } {
  const rawValue = cell.value;

  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return { value: null, error: null };
  }

  if (typeof rawValue !== "string") {
    return {
      value: null,
      error: `Kolom ${label} harus disimpan sebagai teks agar nilainya tidak berubah.`,
    };
  }

  return { value: rawValue, error: null };
}

export async function parseImportWorkbook(
  buffer: ArrayBuffer,
): Promise<ParsedImportWorkbook> {
  let workbook: ExcelJS.Workbook;

  try {
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
  } catch {
    throw new InvalidImportWorkbookError(
      "File tidak dapat dibaca sebagai workbook Excel .xlsx.",
    );
  }

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new InvalidImportWorkbookError(
      "File Excel tidak memiliki worksheet.",
    );
  }

  if (worksheet.rowCount > MAX_IMPORT_ROWS + 1) {
    throw new InvalidImportWorkbookError(
      `File melebihi batas ${MAX_IMPORT_ROWS.toLocaleString("id-ID")} baris data.`,
    );
  }

  const headerRow = worksheet.getRow(1);
  const headerColumns = new Map<string, number[]>();

  headerRow.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    const header = normalizeHeader(cell.text);
    const columns = headerColumns.get(header) ?? [];
    columns.push(columnNumber);
    headerColumns.set(header, columns);
  });

  const orderColumns = headerColumns.get("nomor pesanan") ?? [];
  const barcodeColumns = headerColumns.get("resi") ?? [];

  if (orderColumns.length !== 1 || barcodeColumns.length !== 1) {
    throw new InvalidImportWorkbookError(
      'Header harus memuat tepat satu kolom "Nomor Pesanan" dan satu kolom "Resi".',
    );
  }

  const orderColumn = orderColumns[0];
  const barcodeColumn = barcodeColumns[0];
  const rows: ParsedImportRow[] = [];
  const invalidRows: ImportRowIssue[] = [];
  let rowsRead = 0;

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    let hasContent = false;

    row.eachCell({ includeEmpty: false }, (cell) => {
      const value = cell.value;
      if (value !== null && value !== undefined && value !== "") {
        hasContent = true;
      }
    });

    if (!hasContent) {
      continue;
    }

    rowsRead += 1;
    const orderValue = getIdentifierValue(
      row.getCell(orderColumn),
      "Nomor Pesanan",
    );
    const barcodeValue = getIdentifierValue(row.getCell(barcodeColumn), "Resi");
    const orderNumber = orderValue.value?.trim() || null;

    if (orderValue.error || barcodeValue.error) {
      invalidRows.push({
        rowNumber,
        orderNumber,
        reason: orderValue.error ?? barcodeValue.error ?? "Data tidak valid.",
      });
      continue;
    }

    if (!orderNumber) {
      invalidRows.push({
        rowNumber,
        orderNumber: null,
        reason: "Nomor Pesanan wajib diisi.",
      });
      continue;
    }

    const rawBarcode = barcodeValue.value;
    const barcode = rawBarcode?.trim() ? rawBarcode : null;

    if (barcode && barcode !== barcode.trim()) {
      invalidRows.push({
        rowNumber,
        orderNumber,
        reason: "Resi tidak boleh memiliki spasi di awal atau akhir.",
      });
      continue;
    }

    rows.push({ rowNumber, orderNumber, barcode });
  }

  return { rowsRead, rows, invalidRows };
}