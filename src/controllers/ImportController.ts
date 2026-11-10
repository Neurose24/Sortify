import { NextResponse } from "next/server";
import {
  ImportConflictError,
  ImportStoreNotFoundError,
  importPackagesForSeller,
} from "@/services/import.service";
import {
  InvalidImportWorkbookError,
  MAX_IMPORT_ROWS,
  parseImportWorkbook,
} from "@/validators/import.validator";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export async function importPackagesController(
  request: Request,
  sellerId: string,
) {
  const contentLength = Number(request.headers.get("content-length"));

  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_FILE_SIZE_BYTES + 64 * 1024
  ) {
    return NextResponse.json(
      { success: false, message: "Ukuran file maksimal 5 MB." },
      { status: 413 },
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, message: "Form upload tidak dapat dibaca." },
      { status: 400 },
    );
  }

  const storeIdValue = formData.get("storeId");
  const fileValue = formData.get("file");

  if (typeof storeIdValue !== "string" || !storeIdValue.trim()) {
    return NextResponse.json(
      { success: false, message: "Pilih toko sebelum mengimpor." },
      { status: 422 },
    );
  }

  if (!(fileValue instanceof File)) {
    return NextResponse.json(
      { success: false, message: "Pilih satu file Excel .xlsx." },
      { status: 422 },
    );
  }

  if (!fileValue.name.toLocaleLowerCase("id-ID").endsWith(".xlsx")) {
    return NextResponse.json(
      { success: false, message: "Format file harus .xlsx." },
      { status: 415 },
    );
  }

  if (fileValue.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { success: false, message: "Ukuran file maksimal 5 MB." },
      { status: 413 },
    );
  }

  if (fileValue.size === 0) {
    return NextResponse.json(
      { success: false, message: "File Excel kosong." },
      { status: 422 },
    );
  }

  try {
    const workbook = await parseImportWorkbook(
      await fileValue.arrayBuffer(),
    );

    if (workbook.rowsRead > MAX_IMPORT_ROWS) {
      return NextResponse.json(
        {
          success: false,
          message: `File melebihi batas ${MAX_IMPORT_ROWS.toLocaleString("id-ID")} baris data.`,
        },
        { status: 422 },
      );
    }

    const result = await importPackagesForSeller({
      sellerId,
      storeId: storeIdValue.trim(),
      workbook,
    });

    return NextResponse.json({
      success: true,
      message: "Import selesai.",
      data: result,
    });
  } catch (error) {
    if (error instanceof InvalidImportWorkbookError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 422 },
      );
    }

    if (error instanceof ImportStoreNotFoundError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 404 },
      );
    }

    if (error instanceof ImportConflictError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 409 },
      );
    }

    console.error("Package import error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Import gagal karena terjadi kesalahan server.",
      },
      { status: 500 },
    );
  }
}