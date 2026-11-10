"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  FileSpreadsheet,
  LockKeyhole,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type StoreOption = {
  id: string;
  nama: string;
  marketplace: { nama: string };
};

type ImportIssue = {
  rowNumber: number;
  orderNumber: string | null;
  reason?: string;
  barcode?: string;
};

type ImportSummary = {
  rowsRead: number;
  created: number;
  updated: number;
  skipped: number;
  conflicts: number;
  invalid: number;
  unknownPrefix: number;
  invalidRows: ImportIssue[];
  conflictRows: ImportIssue[];
  unknownPrefixRows: ImportIssue[];
};

export function ImportDialog({
  children,
  stores = [],
}: {
  children: ReactNode;
  stores?: StoreOption[];
}) {
  const router = useRouter();
  const [storeId, setStoreId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedStore = stores.find((store) => store.id === storeId);

  function chooseFile(selected: File | undefined) {
    setError("");
    setSummary(null);

    if (!selected) {
      setFile(null);
      return;
    }

    if (!selected.name.toLocaleLowerCase("id-ID").endsWith(".xlsx")) {
      setFile(null);
      setError("Pilih file Excel dengan format .xlsx.");
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setFile(null);
      setError("Ukuran file maksimal 5 MB.");
      return;
    }

    setFile(selected);
  }

  async function submitImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSummary(null);

    if (!storeId || !file) {
      setError("Pilih toko dan file .xlsx terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("storeId", storeId);
      formData.set("file", file);

      const response = await fetch("/api/packages/import", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        data?: ImportSummary;
      };

      if (!response.ok || !payload.success || !payload.data) {
        setError(payload.message ?? "Import gagal diproses.");
        return;
      }

      setSummary(payload.data);
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Tidak dapat menghubungi server untuk memproses import.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <form onSubmit={submitImport}>
          <DialogHeader>
            <DialogTitle>Import pesanan dari Excel</DialogTitle>
            <DialogDescription>
              Unggah workbook .xlsx berisi kolom Nomor Pesanan dan Resi untuk
              satu toko.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-7 p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium-exact">
                Toko saya <span className="text-brand">*</span>
                <select
                  required
                  value={storeId}
                  onChange={(event) => {
                    setStoreId(event.target.value);
                    setSummary(null);
                    setError("");
                  }}
                  className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 text-sm font-normal"
                >
                  <option value="">Pilih toko</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.nama}
                    </option>
                  ))}
                </select>
                <span className="block text-xs font-normal text-muted-foreground">
                  {stores.length > 0
                    ? "Hanya toko yang ditugaskan kepada akun Anda."
                    : "Belum ada toko yang ditugaskan. Hubungi Admin."}
                </span>
              </label>
              <div className="space-y-2 text-sm font-medium-exact">
                Marketplace · Otomatis
                <span className="mt-2 flex h-11 items-center justify-between rounded-lg border border-line bg-[#eef2f0] px-3 font-normal text-muted-foreground">
                  {selectedStore?.marketplace.nama ?? "Mengikuti toko"}
                  <LockKeyhole className="size-4" />
                </span>
                <span className="block text-xs font-normal text-muted-foreground">
                  Marketplace mengikuti toko yang dipilih.
                </span>
              </div>
            </div>
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold-exact">
                  File Excel <span className="text-brand">*</span>
                </p>
                <a
                  href="/api/packages/import/template"
                  className="inline-flex items-center gap-2 text-sm font-semibold-exact text-brand"
                >
                  <Download className="size-4" /> Unduh template .xlsx
                </a>
              </div>
              <label className="flex min-h-20 cursor-pointer flex-wrap items-center gap-4 rounded-lg border border-dashed border-line bg-canvas p-5">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand">
                  <FileSpreadsheet className="size-6" />
                </span>
                <span className="mr-auto text-sm text-muted-foreground">
                  {file
                    ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB`
                    : ".xlsx, maksimal 5 MB dan 5.000 baris"}
                </span>
                <span className="inline-flex h-[42px] items-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-semibold-exact text-ink">
                  <Upload className="size-4" /> Pilih File
                </span>
                <input
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="sr-only"
                  onChange={(event) => {
                    chooseFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
              <p className="mt-3 text-xs text-muted-foreground">
                Header wajib: Nomor Pesanan dan Resi. Baris boleh memiliki
                Resi kosong; pastikan kedua kolom disimpan sebagai teks.
              </p>
            </div>
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
            {summary && <ImportResult summary={summary} />}
          </div>
          <DialogFooter className="bg-canvas">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Tutup
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting || !file || !storeId || stores.length === 0}
            >
              <Upload className="size-4" />
              {isSubmitting ? "Memproses..." : "Import"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ImportResult({ summary }: { summary: ImportSummary }) {
  return (
    <section
      aria-live="polite"
      className="space-y-4 rounded-xl border border-line bg-white p-4"
    >
      <h3 className="text-sm font-semibold-exact">Ringkasan import</h3>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <SummaryCount label="Baris dibaca" value={summary.rowsRead} />
        <SummaryCount label="Paket baru" value={summary.created} />
        <SummaryCount label="Resi diperbarui" value={summary.updated} />
        <SummaryCount label="Dilewati" value={summary.skipped} />
        <SummaryCount label="Konflik" value={summary.conflicts} />
        <SummaryCount label="Tidak valid" value={summary.invalid} />
        <SummaryCount label="Prefix tidak dikenal" value={summary.unknownPrefix} />
      </dl>
      <IssueList
        title="Konflik"
        issues={summary.conflictRows}
        reason="reason"
      />
      <IssueList
        title="Baris tidak valid"
        issues={summary.invalidRows}
        reason="reason"
      />
      <IssueList
        title="Prefix tidak dikenal"
        issues={summary.unknownPrefixRows}
        reason="barcode"
      />
    </section>
  );
}

function SummaryCount({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold-exact">{value.toLocaleString("id-ID")}</dd>
    </div>
  );
}

function IssueList({
  title,
  issues,
  reason,
}: {
  title: string;
  issues: ImportIssue[];
  reason: "reason" | "barcode";
}) {
  if (issues.length === 0) {
    return null;
  }

  const visibleIssues = issues.slice(0, 50);

  return (
    <div className="space-y-2 text-xs">
      <h4 className="font-semibold-exact">
        {title} ({issues.length})
      </h4>
      <ul className="max-h-32 space-y-1 overflow-y-auto text-muted-foreground">
        {visibleIssues.map((issue) => (
          <li key={`${issue.rowNumber}-${issue.orderNumber}-${issue[reason]}`}>
            Baris {issue.rowNumber}
            {issue.orderNumber ? ` · ${issue.orderNumber}` : ""}
            {issue[reason] ? ` · ${issue[reason]}` : ""}
          </li>
        ))}
      </ul>
      {issues.length > visibleIssues.length && (
        <p className="text-muted-foreground">
          Menampilkan {visibleIssues.length} dari {issues.length} baris.
        </p>
      )}
    </div>
  );
}
