import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authorizeApiRequest } from "@/lib/api-auth";
import { getCurrentSession } from "@/lib/auth";
import {
  changeUserPassword,
  ConcurrentPasswordChangeError,
  InvalidCurrentPasswordError,
  ReusedPasswordError,
} from "@/services/password-change.service";
import { passwordChangeSchema } from "@/validators/password-change.validator";

export async function PATCH(request: Request) {
  const authorization = await authorizeApiRequest([
    "ADMIN",
    "SELLER",
    "PETUGAS",
  ]);
  if (!authorization.authorized) return authorization.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Format JSON tidak valid." },
      { status: 400 },
    );
  }

  let input;
  try {
    input = passwordChangeSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message ?? "Data password tidak valid.",
          errors: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 422 },
      );
    }
    throw error;
  }

  try {
    const session = await getCurrentSession();
    if (!session || session.userId !== authorization.user.id) {
      return NextResponse.json(
        { success: false, message: "Sesi tidak valid. Silakan login kembali." },
        { status: 401 },
      );
    }

    await changeUserPassword(authorization.user.id, session.id, input);
    return NextResponse.json({
      success: true,
      message: "Password berhasil diperbarui. Sesi lain telah dikeluarkan.",
    });
  } catch (error) {
    if (error instanceof InvalidCurrentPasswordError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 },
      );
    }
    if (error instanceof ReusedPasswordError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 422 },
      );
    }
    if (error instanceof ConcurrentPasswordChangeError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 409 },
      );
    }
    console.error("Password change error:", error);
    return NextResponse.json(
      { success: false, message: "Password gagal diperbarui." },
      { status: 500 },
    );
  }
}
