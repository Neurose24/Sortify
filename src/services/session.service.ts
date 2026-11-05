import { createHash, randomBytes } from "node:crypto";

import {
  createSessionRecord,
  findValidSession,
  deleteSessionByTokenHash,
  deleteAllUserSessions,
  deleteExpiredSessions,
} from "@/models/SessionModel";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function createUserSession(userId: string) {
  const token = randomBytes(32).toString("base64url");

  const tokenHash = hashToken(token);

  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_MS
  );

  await createSessionRecord({
    userId,
    tokenHash,
    expiresAt,
  });

  return {
    token,
    expiresAt,
  };
}

export async function getUserSession(token: string) {
  const tokenHash = hashToken(token);

  return findValidSession(tokenHash);
}

export async function revokeUserSession(token: string) {
  const tokenHash = hashToken(token);

  await deleteSessionByTokenHash(tokenHash);
}

export async function revokeAllUserSessions(userId: string) {
  await deleteAllUserSessions(userId);
}

export async function cleanupExpiredSessions() {
  return deleteExpiredSessions();
}