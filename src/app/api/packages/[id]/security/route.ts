import { NextResponse } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import {
  markPackageSecured,
  PackageUpdateConflictError,
} from "@/services/package-management.service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeApiRequest(["PETUGAS"]);

  if (!authorization.authorized) {
    return authorization.response;
  }

  try {
    const { id } = await context.params;
    const data = await markPackageSecured(id);

    return NextResponse.json({
      success: true,
      message: "Paket ditandai sudah diamankan.",
      data,
    });
  } catch (error) {
    if (error instanceof PackageUpdateConflictError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 409 },
      );
    }

    console.error("Package security update error:", error);
    return NextResponse.json(
      { success: false, message: "Status pengamanan gagal diperbarui." },
      { status: 500 },
    );
  }
}
