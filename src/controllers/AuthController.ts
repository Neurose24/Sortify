import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";

import {
  loginUser,
  InvalidCredentialsError,
} from "@/services/auth.service";

import { revokeUserSession } from "@/services/session.service";
import { loginSchema } from "@/validators/auth.validator";

import { SESSION_COOKIE_NAME } from "@/lib/auth.constants";

export async function loginController(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Format JSON tidak valid.",
        },
        { status: 400 }
      );
    }

    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Data login tidak valid.",
          errors: validation.error.issues,
        },
        { status: 422 }
      );
    }

    const result = await loginUser(validation.data);

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil.",
      data: {
        user: result.user,
      },
    });

    response.cookies.set(
      SESSION_COOKIE_NAME,
      result.session.token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: result.session.expiresAt,
      }
    );

    return response;
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return NextResponse.json(
        {
          success: false,
          message: "Username atau password tidak valid.",
        },
        { status: 401 }
      );
    }

    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}

export async function logoutController() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await revokeUserSession(token);
    }

    const response = NextResponse.json({
      success: true,
      message: "Logout berhasil.",
    });

    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat logout.",
      },
      { status: 500 }
    );
  }
}

export async function getMeController() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Anda belum login atau session sudah berakhir.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Session masih valid.",
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}