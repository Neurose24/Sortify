import { z } from "zod";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus memakai format YYYY-MM-DD.")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Tanggal tidak valid.");

export const reportFilterSchema = z
  .object({
    storeId: z.string().trim().max(100).optional().default(""),
    marketplaceId: z.string().trim().max(100).optional().default(""),
    expeditionId: z.string().trim().max(100).optional().default(""),
    status: z
      .union([
        z.literal(""),
        z.enum(["NORMAL", "PENDING", "BATAL", "DUPLIKAT", "PREFIX_TIDAK_DIKENAL"]),
      ])
      .optional()
      .default(""),
    from: z
      .union([dateSchema, z.literal("")])
      .optional()
      .default(""),
    to: z
      .union([dateSchema, z.literal("")])
      .optional()
      .default(""),
  })
  .refine(({ from, to }) => !from || !to || from <= to, {
    message: "Tanggal awal tidak boleh melewati tanggal akhir.",
    path: ["from"],
  })
  .refine(({ from, to }) => Boolean(from) === Boolean(to), {
    message: "Isi kedua tanggal atau kosongkan keduanya.",
    path: ["to"],
  });

export type ReportFilters = z.infer<typeof reportFilterSchema>;
