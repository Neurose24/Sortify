import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { getReportExportData } from "@/services/dashboard.service";
import { reportFilterSchema } from "@/validators/report.validator";

const conditionLabels: Record<string, string> = {
  NORMAL: "Normal",
  PENDING: "Pending",
  BATAL: "Batal",
  DUPLIKAT: "Duplikat",
  PREFIX_TIDAK_DIKENAL: "Prefix tidak dikenal",
};

const scanResultLabels: Record<string, string> = {
  BERHASIL: "Berhasil",
  BARCODE_TIDAK_DIKENAL: "Barcode tidak dikenal",
  PREFIX_TIDAK_DIKENAL: "Prefix tidak dikenal",
  SUDAH_PERNAH_DISCAN: "Sudah pernah discan",
  PAKET_PENDING: "Paket pending",
  PAKET_BATAL: "Paket batal",
  PAKET_DUPLIKAT: "Paket duplikat",
  GAGAL: "Gagal",
};

function asJakartaExcelDate(value: Date) {
  return new Date(value.getTime() + 7 * 60 * 60 * 1000);
}

function setHeaderStyle(worksheet: ExcelJS.Worksheet) {
  const header = worksheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF087F5B" },
  };
  header.alignment = { vertical: "middle" };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columnCount },
  };
}

export async function GET(request: Request) {
  const authorization = await authorizeApiRequest(["ADMIN", "SELLER"]);

  if (!authorization.authorized) {
    return authorization.response;
  }

  const role = authorization.user.role;
  if (role !== "ADMIN" && role !== "SELLER") {
    return NextResponse.json({ success: false, message: "Role tidak diizinkan." }, { status: 403 });
  }

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsedFilters = reportFilterSchema.safeParse(params);

  if (!parsedFilters.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Filter laporan tidak valid.",
        errors: parsedFilters.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const report = await getReportExportData(role, authorization.user.id, parsedFilters.data);

  if (report.tooManyRows) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Ekspor dibatasi hingga 50.000 baris per sheet. Persempit rentang tanggal atau filter laporan.",
      },
      { status: 413 },
    );
  }
  const { packages, scans } = report;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sortify";
  workbook.created = new Date();

  const summary = workbook.addWorksheet("Ringkasan");
  summary.columns = [
    { header: "Metrik", key: "metric", width: 32 },
    { header: "Nilai", key: "value", width: 32 },
  ];
  summary.addRows([
    { metric: "Tanggal mulai", value: parsedFilters.data.from || "Semua" },
    { metric: "Tanggal akhir", value: parsedFilters.data.to || "Semua" },
    { metric: "Total paket", value: packages.length },
    {
      metric: "Paket sudah discan",
      value: packages.filter((item) => item.statusScan === "SUDAH_DISCAN").length,
    },
    {
      metric: "Paket perlu diamankan",
      value: packages.filter((item) => item.statusPengamanan === "PERLU_DIAMANKAN").length,
    },
    { metric: "Total catatan scan", value: scans.length },
  ]);
  summary.addRow([]);
  summary.addRow({ metric: "Kondisi paket", value: "Jumlah" });
  const conditionHeader = summary.lastRow;
  if (conditionHeader) {
    conditionHeader.font = { bold: true };
  }
  for (const [status, label] of Object.entries(conditionLabels)) {
    summary.addRow({
      metric: label,
      value: packages.filter((item) => item.statusPaket === status).length,
    });
  }
  summary.addRow([]);
  summary.addRow({ metric: "Hasil scan", value: "Jumlah" });
  const scanHeader = summary.lastRow;
  if (scanHeader) {
    scanHeader.font = { bold: true };
  }
  for (const [status, label] of Object.entries(scanResultLabels)) {
    summary.addRow({
      metric: label,
      value: scans.filter((item) => item.hasilScan === status).length,
    });
  }
  setHeaderStyle(summary);
  summary.autoFilter = undefined;

  const packageSheet = workbook.addWorksheet("Paket");
  packageSheet.columns = [
    { header: "Nomor Pesanan", key: "order", width: 30, style: { numFmt: "@" } },
    { header: "Resi", key: "barcode", width: 30, style: { numFmt: "@" } },
    { header: "Toko", key: "store", width: 24 },
    { header: "Marketplace", key: "marketplace", width: 20 },
    { header: "Seller", key: "seller", width: 24 },
    { header: "Ekspedisi", key: "expedition", width: 20 },
    { header: "Kondisi", key: "condition", width: 24 },
    { header: "Status scan", key: "scanStatus", width: 20 },
    { header: "Pengamanan", key: "security", width: 22 },
    { header: "Dibuat (WIB)", key: "createdAt", width: 24, style: { numFmt: "dd/mm/yyyy hh:mm" } },
  ];
  for (const item of packages) {
    packageSheet.addRow({
      order: item.nomorPesanan,
      barcode: item.barcode ?? "",
      store: item.store.nama,
      marketplace: item.store.marketplace.nama,
      seller: item.store.seller.nama,
      expedition: item.expedition?.nama ?? "",
      condition: conditionLabels[item.statusPaket] ?? item.statusPaket,
      scanStatus: item.statusScan === "SUDAH_DISCAN" ? "Sudah discan" : "Belum discan",
      security: item.statusPengamanan,
      createdAt: asJakartaExcelDate(item.createdAt),
    });
  }
  setHeaderStyle(packageSheet);

  const scanSheet = workbook.addWorksheet("Riwayat scan");
  scanSheet.columns = [
    { header: "Waktu (WIB)", key: "scannedAt", width: 24, style: { numFmt: "dd/mm/yyyy hh:mm" } },
    ...(role === "ADMIN" ? [{ header: "Petugas", key: "user", width: 24 }] : []),
    { header: "Barcode", key: "barcode", width: 30, style: { numFmt: "@" } },
    { header: "Nomor Pesanan", key: "order", width: 30, style: { numFmt: "@" } },
    { header: "Toko", key: "store", width: 24 },
    { header: "Marketplace", key: "marketplace", width: 20 },
    { header: "Ekspedisi", key: "expedition", width: 20 },
    { header: "Hasil", key: "result", width: 26 },
    { header: "Kondisi paket", key: "condition", width: 24 },
    { header: "Pengamanan", key: "security", width: 22 },
    { header: "Keterangan", key: "note", width: 48 },
  ];
  for (const item of scans) {
    scanSheet.addRow({
      scannedAt: asJakartaExcelDate(item.scannedAt),
      ...(role === "ADMIN" ? { user: item.user.nama } : {}),
      barcode: item.barcode,
      order: item.package?.nomorPesanan ?? "",
      store: item.package?.store.nama ?? "",
      marketplace: item.package?.store.marketplace.nama ?? "",
      expedition: item.package?.expedition?.nama ?? "",
      result: scanResultLabels[item.hasilScan] ?? item.hasilScan,
      condition: item.statusPaket ? (conditionLabels[item.statusPaket] ?? item.statusPaket) : "",
      security: item.statusPengamanan ?? "",
      note: item.keterangan ?? "",
    });
  }
  setHeaderStyle(scanSheet);

  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replaceAll("-", "");

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="sortify-laporan-${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
