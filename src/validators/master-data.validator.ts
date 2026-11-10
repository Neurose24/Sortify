import { z } from "zod";

const nameSchema = z.string().trim().min(1, "Nama wajib diisi.").max(100);

export const marketplaceInputSchema = z.object({
  nama: nameSchema,
});

export const storeInputSchema = z.object({
  nama: nameSchema,
  marketplaceId: z.string().trim().min(1, "Pilih marketplace."),
  sellerId: z.string().trim().min(1, "Pilih Seller."),
});

export const expeditionInputSchema = z.object({
  nama: nameSchema,
});

export const prefixRuleInputSchema = z
  .object({
    expeditionId: z.string().trim().min(1, "Pilih ekspedisi."),
    awalan: z.string().trim().max(100).optional().default(""),
    akhiran: z.string().trim().max(100).optional().default(""),
    panjang: z
      .union([
        z.literal(""),
        z.number().int().positive().max(1000),
        z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive().max(1000)),
      ])
      .optional()
      .default(""),
  })
  .refine((value) => Boolean(value.awalan || value.akhiran || value.panjang), {
    message: "Isi minimal awalan, akhiran, atau panjang barcode.",
    path: ["awalan"],
  });

export const createUserInputSchema = z.object({
  nama: nameSchema,
  username: z.string().trim().min(1, "Username wajib diisi.").max(100),
  role: z.enum(["ADMIN", "SELLER", "PETUGAS"]),
  password: z.string().min(8, "Password minimal 8 karakter.").max(128),
});

export const updateUserInputSchema = createUserInputSchema.omit({ password: true }).extend({
  password: z
    .union([z.literal(""), z.string().min(8, "Password minimal 8 karakter.").max(128)])
    .optional()
    .default(""),
});

export type MasterDataResource =
  | "marketplaces"
  | "stores"
  | "expeditions"
  | "prefix-rules"
  | "users";
