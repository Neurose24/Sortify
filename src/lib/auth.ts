import { cookies } from "next/headers";

import {
  getUserSession,
} from "@/services/session.service";

import {
    SESSION_COOKIE_NAME
} from "@/lib/auth.constants";

export async function getCurrentSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return getUserSession(token);
}

export async function getCurrentUser() {
  const session = await getCurrentSession();

  return session?.user ?? null;
}

export async function hasRole(
  allowedRoles: string[]
) {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  return allowedRoles.includes(user.role);
}