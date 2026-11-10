import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";

export async function GET() {
  const authorization = await authorizeApiRequest(["SELLER"]);

  if (!authorization.authorized) {
    return authorization.response;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Pesanan");
  worksheet.columns = [
    { header: "Nomor Pesanan", key: "orderNumber", width: 30, style: { numFmt: "@" } },
    { header: "Resi", key: "barcode", width: 30, style: { numFmt: "@" } },
  ];
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(2).getCell(1).numFmt = "@";
  worksheet.getRow(2).getCell(2).numFmt = "@";

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="sortify-template-import.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
