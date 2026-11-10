import { NextResponse } from "next/server";
import { scanPackage } from "@/services/scan.service";
import { scanBarcodeSchema } from "@/validators/scan.validator";

export async function scanBarcodeController(
  request: Request,
  userId: string,
) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Format JSON tidak valid." },
      { status: 400 },
    );
  }

  const validation = scanBarcodeSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        message:
          validation.error.issues[0]?.message ??
          "Barcode atau nomor resi wajib diisi.",
      },
      { status: 422 },
    );
  }

  try {
    const result = await scanPackage(userId, validation.data);

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    console.error("Barcode scan error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Scan gagal diproses dan riwayat tidak dapat dikonfirmasi. Periksa koneksi lalu coba lagi.",
      },
      { status: 500 },
    );
  }
}