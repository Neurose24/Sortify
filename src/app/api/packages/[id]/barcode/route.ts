import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeApiRequest } from "@/lib/api-auth";
import {
  addBarcodeForSeller,
  PackageNotFoundError,
  PackageUpdateConflictError,
  InvalidPackageActionError,
} from "@/services/package-management.service";

const barcodeSchema = z.object({
  barcode: z.string().trim().min(1).max(200),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeApiRequest(["SELLER"]);

  if (!authorization.authorized) {
    return authorization.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Format JSON tidak valid." },
      { status: 400 },
    );
  }

  const validation = barcodeSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, message: "Resi harus diisi dan maksimal 200 karakter." },
      { status: 422 },
    );
  }

  try {
    const { id } = await context.params;
    const data = await addBarcodeForSeller(
      id,
      authorization.user.id,
      validation.data.barcode,
    );

    return NextResponse.json({
      success: true,
      message: "Resi berhasil ditambahkan.",
      data,
    });
  } catch (error) {
    if (error instanceof PackageNotFoundError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 404 },
      );
    }

    if (error instanceof InvalidPackageActionError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 422 },
      );
    }

    if (error instanceof PackageUpdateConflictError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 409 },
      );
    }

    console.error("Package barcode update error:", error);
    return NextResponse.json(
      { success: false, message: "Resi paket gagal diperbarui." },
      { status: 500 },
    );
  }
}
