"use client";

import {
  ArrowRight,
  Barcode,
  CircleAlert,
  CircleCheck,
  Keyboard,
  Package,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardShell, PageHeading } from "./dashboard-shell";

type ScanOutcome =
  | "BERHASIL"
  | "BARCODE_TIDAK_DIKENAL"
  | "PREFIX_TIDAK_DIKENAL"
  | "SUDAH_PERNAH_DISCAN"
  | "PAKET_PENDING"
  | "PAKET_BATAL"
  | "PAKET_DUPLIKAT"
  | "GAGAL";

type RecentScan = {
  id: string;
  barcode: string;
  hasilScan: ScanOutcome;
  keterangan: string | null;
  scannedAt: string;
  package: { nomorPesanan: string; store: { nama: string } } | null;
};

type AttentionPackage = {
  id: string;
  nomorPesanan: string;
  barcode: string | null;
  statusPaket: string;
  store: { nama: string };
};

type ScanResultData = {
  id: string;
  barcode: string;
  result: ScanOutcome;
  message: string;
  scannedAt: string;
  package: null | {
    id: string;
    nomorPesanan: string;
    statusScan: "BELUM_DISCAN" | "SUDAH_DISCAN";
    statusPaket:
      | "NORMAL"
      | "PENDING"
      | "BATAL"
      | "DUPLIKAT"
      | "PREFIX_TIDAK_DIKENAL";
    statusPengamanan:
      | "TIDAK_PERLU"
      | "PERLU_DIAMANKAN"
      | "SUDAH_DIAMANKAN";
    store: string;
    marketplace: string;
    expedition: string | null;
    updatedAt: string;
    createdBy: string | null;
  };
};

type ScanPageProps = {
  userName: string;
  today: { total: number; success: number; other: number };
  recent: RecentScan[];
  attention: AttentionPackage[];
};

const resultLabels: Record<ScanOutcome, string> = {
  BERHASIL: "Berhasil",
  BARCODE_TIDAK_DIKENAL: "Barcode tidak dikenal",
  PREFIX_TIDAK_DIKENAL: "Prefix tidak dikenal",
  SUDAH_PERNAH_DISCAN: "Sudah pernah discan",
  PAKET_PENDING: "Paket pending",
  PAKET_BATAL: "Paket batal",
  PAKET_DUPLIKAT: "Paket duplikat",
  GAGAL: "Gagal",
};

function resultTone(
  result: ScanOutcome,
): "success" | "warning" | "danger" | "neutral" {
  if (result === "BERHASIL") return "success";
  if (result === "PAKET_BATAL" || result === "PAKET_DUPLIKAT" || result === "GAGAL") {
    return "danger";
  }
  if (result === "SUDAH_PERNAH_DISCAN") return "neutral";
  return "warning";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function ScanPage({
  userName,
  today,
  recent,
  attention,
}: ScanPageProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [barcode, setBarcode] = useState("");
  const [result, setResult] = useState<ScanResultData | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [securingId, setSecuringId] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState("");

  async function markSecured(packageId: string) {
    setSecuringId(packageId);
    setSecurityError("");

    try {
      const response = await fetch(`/api/packages/${packageId}/security`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.success) {
        setSecurityError(payload.message ?? "Status pengamanan gagal diperbarui.");
        return;
      }

      router.refresh();
    } catch (requestError) {
      setSecurityError(
        requestError instanceof Error
          ? requestError.message
          : "Tidak dapat menghubungi server.",
      );
    } finally {
      setSecuringId(null);
    }
  }

  async function scan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!barcode.trim()) {
      setError("Pindai atau masukkan barcode terlebih dahulu.");
      inputRef.current?.focus();
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        data?: ScanResultData;
      };

      if (!response.ok || !payload.success || !payload.data) {
        setError(payload.message ?? "Scan tidak dapat diproses.");
        return;
      }

      setResult(payload.data);
      setBarcode("");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Tidak dapat menghubungi server untuk memproses scan.",
      );
    } finally {
      setSubmitting(false);
      inputRef.current?.focus();
    }
  }

  return (
    <DashboardShell role="petugas" section="Scan Paket" userName={userName}>
      <div className="mx-auto max-w-[1500px] p-5 sm:p-8 lg:p-10">
        <PageHeading
          title="Scan paket"
          description="Pindai barcode paket untuk memproses dan mencatat setiap percobaan."
          action={
            <span className="text-sm text-muted-foreground">
              {new Intl.DateTimeFormat("id-ID", {
                dateStyle: "full",
                timeZone: "Asia/Jakarta",
              }).format(new Date())}
            </span>
          }
        />
        {attention.length > 0 && (
          <section
            aria-live="polite"
            className="mb-6 rounded-xl border border-[#f1d59d] bg-[#fff9eb] p-5"
          >
            <h2 className="flex items-center gap-2 font-semibold-exact text-[#8a5a00]">
              <CircleAlert className="size-5" />
              Paket yang pernah Anda scan memerlukan perhatian
            </h2>
            <p className="mt-2 text-sm text-[#72571e]">
              Status paket yang sebelumnya berhasil Anda scan telah berubah.
              Periksa paket berikut dan tindak lanjuti sesuai prosedur.
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[#72571e]">
              {attention.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f1d59d] pt-3"
                >
                  <span>
                    {item.nomorPesanan} · {item.store.nama} ·{" "}
                    {item.statusPaket === "BATAL" ? "Batal" : "Pending"}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={securingId !== null}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Konfirmasi bahwa paket ${item.nomorPesanan} sudah diamankan secara fisik?`,
                        )
                      ) {
                        void markSecured(item.id);
                      }
                    }}
                  >
                    {securingId === item.id
                      ? "Menyimpan..."
                      : "Tandai sudah diamankan"}
                  </Button>
                </li>
              ))}
            </ul>
            {securityError && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {securityError}
              </p>
            )}
          </section>
        )}
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="mb-5 flex items-center gap-3 font-semibold-exact">
                <ScanLine className="size-5 text-brand" /> Pindai barcode paket
              </h2>
              <form onSubmit={scan}>
                <label
                  htmlFor="scan-barcode"
                  className="mb-2 block text-xs font-medium-exact"
                >
                  Barcode / nomor resi
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Barcode className="absolute left-4 top-[17px] size-5 text-brand" />
                    <input
                      ref={inputRef}
                      id="scan-barcode"
                      autoFocus
                      autoComplete="off"
                      value={barcode}
                      onChange={(event) => {
                        setBarcode(event.target.value);
                        setResult(null);
                        setError("");
                      }}
                      placeholder="Pindai atau ketik nomor resi..."
                      className="h-[60px] w-full rounded-lg border border-line bg-white pl-14 pr-4 font-mono-exact text-xl placeholder:font-sans placeholder:text-base placeholder:text-[#8b9791] focus:border-brand"
                    />
                  </div>
                  <Button size="lg" className="mt-2" type="submit" disabled={submitting}>
                    <ScanLine className="size-4" />
                    {submitting ? "Memproses..." : "Scan"}
                  </Button>
                </div>
                <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Keyboard className="size-4" />
                  Pindai dengan scanner keyboard lalu tekan Enter. Barcode
                  dicocokkan tepat setelah spasi tepi dihapus.
                </p>
              </form>
              {error && (
                <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}
            </Card>
            {result && <ScanResult result={result} />}
          </div>
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="font-semibold-exact">Pemindaian saya hari ini</h2>
              <p className="mt-2 text-xs text-muted-foreground">
                {userName} · zona waktu WIB
              </p>
              <div className="mt-7 grid grid-cols-3">
                <Stat value={today.total} label="Total scan" />
                <Stat value={today.success} label="Berhasil" green />
                <Stat value={today.other} label="Hasil lain" red />
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="flex items-start justify-between gap-3 p-6">
                <div>
                  <h2 className="font-semibold-exact">Scan terbaru</h2>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Percobaan Anda, terbaru lebih dahulu.
                  </p>
                </div>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/petugas/history">
                    Riwayat <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
              {recent.length === 0 ? (
                <p className="border-t border-line p-6 text-sm text-muted-foreground">
                  Belum ada percobaan scan.
                </p>
              ) : (
                recent.map((item) => (
                  <div key={item.id} className="border-t border-line p-6">
                    <div className="flex justify-between gap-3">
                      <p className="break-all font-mono-exact text-xs">
                        {item.barcode}
                      </p>
                      <Badge tone={resultTone(item.hasilScan)}>
                        {resultLabels[item.hasilScan]}
                      </Badge>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {item.package
                        ? `${item.package.nomorPesanan} · ${item.package.store.nama}`
                        : item.keterangan ?? "Paket tidak ditemukan"}
                    </p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {formatDateTime(item.scannedAt)} WIB
                    </p>
                  </div>
                ))
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function ScanResult({ result }: { result: ScanResultData }) {
  const successful = result.result === "BERHASIL";
  const tone = resultTone(result.result);

  return (
    <div className="space-y-4">
      <div
        role="status"
        className={`flex gap-3 rounded-lg p-5 ${
          successful
            ? "bg-brand-soft text-brand"
            : tone === "danger"
              ? "bg-red-50 text-red-800"
              : tone === "warning"
                ? "bg-[#fff8e8] text-[#8a5a00]"
                : "bg-canvas text-ink"
        }`}
      >
        {successful ? (
          <CircleCheck className="size-5 shrink-0" />
        ) : (
          <CircleAlert className="size-5 shrink-0" />
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold-exact">{resultLabels[result.result]}</p>
            <Badge tone={tone}>{resultLabels[result.result]}</Badge>
          </div>
          <p className="mt-1 text-xs">{result.message}</p>
          <p className="mt-2 text-xs">
            Dicatat {formatDateTime(result.scannedAt)} WIB
          </p>
        </div>
      </div>
      {result.package && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Status
              icon={ScanLine}
              label="Status scan"
              value={
                result.package.statusScan === "SUDAH_DISCAN"
                  ? "Sudah dipindai"
                  : "Belum dipindai"
              }
            />
            <Status
              icon={Package}
              label="Status paket"
              value={result.package.statusPaket.replaceAll("_", " ")}
            />
            <Status
              icon={ShieldCheck}
              label="Status pengamanan"
              value={result.package.statusPengamanan.replaceAll("_", " ")}
            />
          </div>
          <Card className="p-6">
            <h2 className="font-semibold-exact">Informasi paket</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Identitas paket hanya dapat dibaca.
            </p>
            <div className="mt-7 grid gap-6 sm:grid-cols-2">
              {Object.entries({
                "Nomor pesanan": result.package.nomorPesanan,
                "Barcode / nomor resi": result.barcode,
                Toko: result.package.store,
                Marketplace: result.package.marketplace,
                Ekspedisi: result.package.expedition ?? "Belum dikenali",
                "Pembuat data paket":
                  result.package.createdBy ?? "Tidak diketahui",
              }).map(([label, value]) => (
                <div key={label}>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="mt-2 break-all text-sm font-medium-exact">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Status({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-5">
      <Icon className="size-5 text-muted-foreground" />
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <Badge className="mt-2">{value}</Badge>
      </div>
    </Card>
  );
}

function Stat({
  value,
  label,
  green,
  red,
}: {
  value: number;
  label: string;
  green?: boolean;
  red?: boolean;
}) {
  return (
    <div>
      <p className={`text-2xl ${green ? "text-brand" : red ? "text-[#b54747]" : ""}`}>
        {value.toLocaleString("id-ID")}
      </p>
      <p className="mt-2 max-w-20 text-[11px] leading-4 text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
