import { z } from "zod";

export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Password saat ini wajib diisi.")
      .max(128, "Password terlalu panjang."),
    newPassword: z
      .string()
      .min(8, "Password baru minimal 8 karakter.")
      .max(128, "Password baru maksimal 128 karakter."),
    confirmPassword: z
      .string()
      .min(1, "Konfirmasi password wajib diisi.")
      .max(128, "Konfirmasi password terlalu panjang."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Konfirmasi password tidak sama.",
    path: ["confirmPassword"],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
