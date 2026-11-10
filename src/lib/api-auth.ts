import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";

type CurrentUser = NonNullable<
  Awaited<ReturnType<typeof getCurrentUser>>
>;

type AuthorizationResult =
  | {
      authorized: true;
      user: CurrentUser;
    }
  | {
      authorized: false;
      response: NextResponse;
    };

export async function authorizeApiRequest(
  allowedRoles: readonly string[]
): Promise<AuthorizationResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Silakan login terlebih dahulu.",
        },
        { status: 401 }
      ),
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Anda tidak memiliki izin untuk mengakses fitur ini.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user,
  };
}