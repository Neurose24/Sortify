import { NextResponse } from "next/server";
import {
  MasterDataConflictError,
  MasterDataNotFoundError,
  MasterDataValidationError,
} from "@/services/admin-master-data.service";
import { ZodError } from "zod";

export function handleMasterDataError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: error.issues[0]?.message ?? "Data yang dikirim tidak valid.",
        errors: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 422 },
    );
  }
  if (error instanceof MasterDataConflictError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 409 });
  }
  if (error instanceof MasterDataNotFoundError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 404 });
  }
  if (error instanceof MasterDataValidationError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 422 });
  }
  console.error("Admin master data error:", error);
  return NextResponse.json(
    { success: false, message: "Perubahan master data gagal disimpan." },
    { status: 500 },
  );
}
