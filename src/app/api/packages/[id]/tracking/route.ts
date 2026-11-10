import { NextResponse } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import {
  PackageTrackingError,
  trackPackage,
} from "@/services/package-tracking.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeApiRequest(["ADMIN", "SELLER"]);

  if (!authorization.authorized) {
    return authorization.response;
  }

  try {
    const { id } = await context.params;
    const tracking = await trackPackage(id, authorization.user);
    return NextResponse.json({ success: true, data: tracking });
  } catch (error) {
    if (error instanceof PackageTrackingError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status },
      );
    }

    console.error("Package tracking error:", error);
    return NextResponse.json(
      { success: false, message: "Pelacakan paket gagal." },
      { status: 500 },
    );
  }
}
