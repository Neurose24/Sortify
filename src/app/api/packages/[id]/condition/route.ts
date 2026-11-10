import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeApiRequest } from "@/lib/api-auth";
import {
  InvalidPackageActionError,
  PackageNotFoundError,
  PackageUpdateConflictError,
  updatePackageCondition,
} from "@/services/package-management.service";

const conditionSchema = z.object({
  statusPaket: z.enum([
    "NORMAL",
    "PENDING",
    "BATAL",
    "DUPLIKAT",
    "PREFIX_TIDAK_DIKENAL",
  ]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeApiRequest(["ADMIN"]);

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

  const validation = conditionSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, message: "Kondisi paket tidak valid." },
      { status: 422 },
    );
  }

  try {
    const { id } = await context.params;
    const data = await updatePackageCondition(
      id,
      validation.data.statusPaket,
    );

    return NextResponse.json({
      success: true,
      message: "Kondisi paket berhasil diperbarui.",
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

    console.error("Package condition update error:", error);
    return NextResponse.json(
      { success: false, message: "Kondisi paket gagal diperbarui." },
      { status: 500 },
    );
  }
}
