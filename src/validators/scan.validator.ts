import { z } from "zod";

export const scanBarcodeSchema = z.object({
  barcode: z.string().trim().min(1, "Masukkan barcode atau nomor resi."),
});

export type ParsedScanInput = z.infer<typeof scanBarcodeSchema>;