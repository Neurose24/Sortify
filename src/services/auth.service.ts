import { findUserByUsername } from "@/models/UserModel";
import { verifyPassword } from "@/services/password.service";
import { createUserSession } from "@/services/session.service";
import type { LoginInput } from "@/validators/auth.validator";

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Username atau password tidak valid.");
    this.name = "InvalidCredentialsError";
  }
}

export async function loginUser(input: LoginInput) {
  const user = await findUserByUsername(input.username);

  if (!user) {
    throw new InvalidCredentialsError();
  }

  const isPasswordValid = await verifyPassword(
    user.password,
    input.password
  );

  if (!isPasswordValid) {
    throw new InvalidCredentialsError();
  }

  const session = await createUserSession(user.id);

  return {
    user: {
      id: user.id,
      nama: user.nama,
      username: user.username,
      role: user.role,
    },
    session: {
      token: session.token,
      expiresAt: session.expiresAt,
    },
  };
}