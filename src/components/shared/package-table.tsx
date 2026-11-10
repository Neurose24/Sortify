"use client";

import {
  CalendarDays,
  Eye,
  FileSpreadsheet,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImportDialog } from "./import-dialog";
import { DashboardShell, PageHeading } from "./dashboard-shell";

type PackageStatus =
  | "NORMAL"
  | "PENDING"
  | "BATAL"
  | "DUPLIKAT"
  | "PREFIX_TIDAK_DIKENAL";
type SecurityStatus =
  | "TIDAK_PERLU"
  | "PERLU_DIAMANKAN"
  | "SUDAH_DIAMANKAN";

type PackageRecord = {
  id: string;
  storeId: string;
  nomorPesanan: string;
  barcode: string | null;
  statusScan: "BELUM_DISCAN" | "SUDAH_DISCAN";
  statusPaket: PackageStatus;
  statusPengamanan: SecurityStatus;
  createdAt: string;
  updatedAt: string;
  store: {
    nama: string;
    sellerId: string;
    marketplace: { nama: string };
  };
  expedition: { nama: string } | null;
  createdBy: { nama: string } | null;
};

type StoreOption = {
  id: string;
  nama: string;
  sellerId: string;
  marketplace: { nama: string };
};

type TrackingResult = {
  summary: {
    awb?: string;
    courier?: string;
    service?: string;
    status?: string;
    date?: string;
    desc?: string;
  };
  detail: {
    origin?: string;
    destination?: string;
    shipper?: string;
    receiver?: string;
  };
  history: Array<{
    date?: string;
    desc?: string;
    location?: string;
  }>;
};

const packageStatusLabels: Record<PackageStatus, string> = {
  NORMAL: "Normal",
  PENDING: "Pending",
  BATAL: "Batal",
  DUPLIKAT: "Duplikat",
  PREFIX_TIDAK_DIKENAL: "Prefix tidak dikenal",
};

const securityStatusLabels: Record<SecurityStatus, string> = {
  TIDAK_PERLU: "Tidak perlu",
  PERLU_DIAMANKAN: "Perlu diamankan",
  SUDAH_DIAMANKAN: "Sudah diamankan",
};

function packageTone(
  status: PackageStatus,
): "success" | "warning" | "danger" | "neutral" {
  if (status === "NORMAL") return "success";
  if (status === "BATAL" || status === "DUPLIKAT") return "danger";
  return "warning";
}

function securityTone(
  status: SecurityStatus,
): "success" | "warning" | "danger" | "neutral" {
  if (status === "SUDAH_DIAMANKAN") return "success";
  if (status === "PERLU_DIAMANKAN") return "warning";
  return "neutral";
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }),
    time: `${date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    })} WIB`,
  };
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  allLabel: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-medium-exact">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-line bg-white px-3 text-xs"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PackagePage({
  role,
  userName,
  stores,
  packages,
}: {
  role: "admin" | "seller";
  userName: string;
  stores: StoreOption[];
  packages: PackageRecord[];
}) {
  const [query, setQuery] = useState("");
  const [storeId, setStoreId] = useState("");
  const [expedition, setExpedition] = useState("");
  const [status, setStatus] = useState("");
  const [scanStatus, setScanStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const isAdmin = role === "admin";

  const filteredPackages = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");

    return packages.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          item.nomorPesanan,
          item.barcode ?? "",
          item.store.nama,
          item.store.marketplace.nama,
          item.expedition?.nama ?? "",
        ]
          .join(" ")
          .toLocaleLowerCase("id-ID")
          .includes(normalizedQuery);
      const matchesStore = !storeId || item.storeId === storeId;
      const matchesExpedition =
        !expedition || item.expedition?.nama === expedition;
      const matchesStatus = !status || item.statusPaket === status;
      const matchesScanStatus = !scanStatus || item.statusScan === scanStatus;
      const createdDate = item.createdAt.slice(0, 10);
      const matchesDateFrom = !dateFrom || createdDate >= dateFrom;
      const matchesDateTo = !dateTo || createdDate <= dateTo;

      return (
        matchesQuery &&
        matchesStore &&
        matchesExpedition &&
        matchesStatus &&
        matchesScanStatus &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [dateFrom, dateTo, expedition, packages, query, scanStatus, status, storeId]);

  const totalPages = Math.max(1, Math.ceil(filteredPackages.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const shown = filteredPackages.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const storeOptions = stores.map((store) => ({
    value: store.id,
    label: `${store.nama} · ${store.marketplace.nama}`,
  }));
  const expeditionOptions = [
    ...new Set(
      packages.flatMap((item) =>
        item.expedition ? [item.expedition.nama] : [],
      ),
    ),
  ]
    .sort((a, b) => a.localeCompare(b, "id"))
    .map((name) => ({ value: name, label: name }));
  const statusOptions = Object.entries(packageStatusLabels).map(
    ([value, label]) => ({ value, label }),
  );
  const scanStatusOptions = [
    { value: "BELUM_DISCAN", label: "Belum discan" },
    { value: "SUDAH_DISCAN", label: "Sudah discan" },
  ];

  function resetFilters() {
    setQuery("");
    setStoreId("");
    setExpedition("");
    setStatus("");
    setScanStatus("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  function updateFilter(update: () => void) {
    update();
    setPage(1);
  }

  return (
    <DashboardShell role={role} section="Paket" userName={userName}>
      <div className="mx-auto max-w-[1500px] p-5 sm:p-8 lg:p-10">
        <PageHeading
          title={isAdmin ? "Paket" : "Pesanan"}
          description={
            isAdmin
              ? "Kelola kondisi dan pantau paket seluruh toko yang terdaftar."
              : `Lacak paket dari ${stores.length} toko yang Anda kelola.`
          }
          action={
            !isAdmin ? (
              <ImportDialog stores={stores}>
                <Button>
                  <FileSpreadsheet className="size-4" /> Import dari Excel
                </Button>
              </ImportDialog>
            ) : undefined
          }
        />
        <Card className="mb-6 p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold-exact">
              <SlidersHorizontal className="size-4" /> Filter{" "}
              {isAdmin ? "paket" : "pesanan"}
            </h2>
            <span className="hidden text-xs text-muted-foreground sm:block">
              {isAdmin
                ? "Filter paket seluruh toko"
                : `Hanya data dari ${stores.length} toko Anda`}
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="relative">
              <span className="mb-2 block text-xs font-medium-exact">
                Cari paket atau resi
              </span>
              <Input
                value={query}
                onChange={(event) =>
                  updateFilter(() => setQuery(event.target.value))
                }
                placeholder="Nomor pesanan / resi / toko"
                className="pr-10"
              />
              <Search className="absolute bottom-3 right-3 size-4 text-muted-foreground" />
            </label>
            <SelectFilter
              label="Toko"
              value={storeId}
              onChange={(value) => updateFilter(() => setStoreId(value))}
              options={storeOptions}
              allLabel={isAdmin ? "Semua toko" : "Semua toko saya"}
            />
            <SelectFilter
              label="Ekspedisi"
              value={expedition}
              onChange={(value) => updateFilter(() => setExpedition(value))}
              options={expeditionOptions}
              allLabel="Semua ekspedisi"
            />
            <SelectFilter
              label="Status paket"
              value={status}
              onChange={(value) => updateFilter(() => setStatus(value))}
              options={statusOptions}
              allLabel="Semua status"
            />
            {!isAdmin && (
              <SelectFilter
                label="Status scan"
                value={scanStatus}
                onChange={(value) => updateFilter(() => setScanStatus(value))}
                options={scanStatusOptions}
                allLabel="Semua status scan"
              />
            )}
            <label>
              <span className="mb-2 block text-xs font-medium-exact">
                Dari tanggal
              </span>
              <span className="relative block">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(event) =>
                    updateFilter(() => setDateFrom(event.target.value))
                  }
                  className="pr-9"
                />
                <CalendarDays className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
              </span>
            </label>
            <label>
              <span className="mb-2 block text-xs font-medium-exact">
                Sampai tanggal
              </span>
              <span className="relative block">
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(event) =>
                    updateFilter(() => setDateTo(event.target.value))
                  }
                  className="pr-9"
                />
                <CalendarDays className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
              </span>
            </label>
            <Button
              variant="secondary"
              className="self-end"
              onClick={resetFilters}
            >
              <RotateCcw className="size-4" /> Reset filter
            </Button>
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5">
            <h2 className="font-semibold-exact">
              {isAdmin ? "Semua paket" : "Paket toko saya"}
              <span className="ml-2 rounded-md bg-[#eef2f0] px-2 py-1 text-xs font-normal text-muted-foreground">
                {filteredPackages.length} paket
              </span>
            </h2>
            <span className="hidden text-xs text-muted-foreground sm:block">
              Terbaru berdasarkan tanggal dibuat
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1020px] border-collapse text-left text-xs">
              <thead className="border-y border-line bg-canvas text-muted-foreground">
                <tr>
                  {[
                    "Paket / Resi",
                    "Toko / Marketplace",
                    "Ekspedisi",
                    "Status scan",
                    "Status paket",
                    "Pengamanan",
                    "Tanggal dibuat",
                    "Aksi",
                  ].map((heading) => (
                    <th key={heading} className="px-6 py-4 font-medium-exact">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((item) => {
                  const created = formatCreatedAt(item.createdAt);

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-line hover:bg-canvas/70"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm">{item.nomorPesanan}</p>
                        <p className="mt-2 break-all font-mono-exact text-[11px] text-muted-foreground">
                          {item.barcode ?? "Belum ada resi"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm">{item.store.nama}</p>
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          {item.store.marketplace.nama}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={item.expedition ? "neutral" : "warning"}>
                          {item.expedition?.nama ??
                            (item.barcode
                              ? "Prefix tidak dikenal"
                              : "Menunggu resi")}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          tone={
                            item.statusScan === "SUDAH_DISCAN"
                              ? "success"
                              : "neutral"
                          }
                        >
                          {item.statusScan === "SUDAH_DISCAN"
                            ? "Sudah discan"
                            : "Belum discan"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={packageTone(item.statusPaket)}>
                          {packageStatusLabels[item.statusPaket]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={securityTone(item.statusPengamanan)}>
                          {securityStatusLabels[item.statusPengamanan]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm">{created.date}</p>
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          {created.time}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <PackageDetail
                          item={item}
                          role={role}
                        />
                      </td>
                    </tr>
                  );
                })}
                {filteredPackages.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      {packages.length === 0
                        ? "Belum ada paket di database."
                        : "Tidak ada paket yang cocok dengan filter."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {filteredPackages.length === 0
                ? "Tidak ada data untuk ditampilkan"
                : `Menampilkan ${(currentPage - 1) * pageSize + 1}–${Math.min(
                    currentPage * pageSize,
                    filteredPackages.length,
                  )} dari ${filteredPackages.length} paket`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Baris per halaman
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  className="h-9 rounded-lg border border-line bg-white px-2 text-xs text-ink"
                >
                  {[10, 25, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage <= 1}
              >
                Sebelumnya
              </Button>
              <span className="min-w-20 text-center text-xs text-muted-foreground">
                Halaman {currentPage} dari {totalPages}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={currentPage >= totalPages}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}

function PackageDetail({
  item,
  role,
}: {
  item: PackageRecord;
  role: "admin" | "seller";
}) {
  const router = useRouter();
  const [condition, setCondition] = useState(item.statusPaket);
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [tracking, setTracking] = useState<TrackingResult | null>(null);
  const [trackingError, setTrackingError] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);

  async function save(
    path: string,
    method: "PATCH",
    body: Record<string, string>,
  ) {
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const response = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.success) {
        setError(payload.message ?? "Pembaruan paket gagal.");
        return;
      }

      setMessage(payload.message ?? "Perubahan tersimpan.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Tidak dapat menghubungi server.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function loadTracking() {
    setTrackingError("");
    setTracking(null);
    setTrackingLoading(true);

    try {
      const response = await fetch(`/api/packages/${item.id}/tracking`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        data?: TrackingResult;
      };

      if (!response.ok || !payload.success || !payload.data) {
        setTrackingError(payload.message ?? "Pelacakan paket gagal.");
        return;
      }

      setTracking(payload.data);
    } catch (requestError) {
      setTrackingError(
        requestError instanceof Error
          ? requestError.message
          : "Tidak dapat menghubungi server.",
      );
    } finally {
      setTrackingLoading(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 font-semibold-exact text-brand">
          <Eye className="size-4" /> Detail
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-[720px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail paket</DialogTitle>
          <DialogDescription>
            Identitas paket dan status terkini dari database.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              ["Nomor pesanan", item.nomorPesanan],
              ["Resi / barcode", item.barcode ?? "Belum ada resi"],
              ["Toko", item.store.nama],
              ["Marketplace", item.store.marketplace.nama],
              ["Ekspedisi", item.expedition?.nama ?? "Belum dikenali"],
              ["Status scan", item.statusScan.replaceAll("_", " ")],
              ["Kondisi paket", packageStatusLabels[item.statusPaket]],
              ["Pengamanan", securityStatusLabels[item.statusPengamanan]],
              ["Dibuat oleh", item.createdBy?.nama ?? "Tidak diketahui"],
              ["Diperbarui", formatCreatedAt(item.updatedAt).date],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-2 break-all text-sm font-medium-exact">
                  {value}
                </p>
              </div>
            ))}
          </div>
          <section className="space-y-4 border-t border-line pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold-exact">Pelacakan paket</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Informasi dari BinderByte. Setiap permintaan dapat memakai
                  kuota API.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void loadTracking()}
                disabled={!item.barcode || trackingLoading}
              >
                <Truck className="size-4" />
                {trackingLoading
                  ? "Memuat pelacakan..."
                  : tracking
                    ? "Perbarui pelacakan"
                    : "Lacak paket"}
              </Button>
            </div>
            {!item.barcode && (
              <p className="text-xs text-muted-foreground">
                Isi nomor resi terlebih dahulu untuk melacak paket.
              </p>
            )}
            {trackingError && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {trackingError}
              </p>
            )}
            {tracking && (
              <div className="space-y-4 rounded-lg border border-line bg-canvas p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Status", tracking.summary.status],
                    ["Layanan", tracking.summary.service],
                    ["Pengirim", tracking.detail.shipper],
                    ["Penerima", tracking.detail.receiver],
                    ["Asal", tracking.detail.origin],
                    ["Tujuan", tracking.detail.destination],
                  ]
                    .filter((entry): entry is [string, string] => Boolean(entry[1]))
                    .map(([label, value]) => (
                      <div key={label}>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="mt-1 break-words text-sm font-medium-exact">
                          {value}
                        </p>
                      </div>
                    ))}
                </div>
                {tracking.summary.desc && (
                  <p className="text-sm">{tracking.summary.desc}</p>
                )}
                {tracking.history.length > 0 && (
                  <ol className="space-y-3 border-t border-line pt-4">
                    {tracking.history.map((entry, index) => (
                      <li
                        key={`${entry.date ?? "event"}-${index}`}
                        className="relative pl-6"
                      >
                        <MapPin className="absolute left-0 top-0.5 size-4 text-brand" />
                        <p className="text-sm">{entry.desc || "Perubahan status paket"}</p>
                        {(entry.date || entry.location) && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {[entry.date, entry.location].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </section>
          {role === "admin" && (
            <form
              className="space-y-3 border-t border-line pt-5"
              onSubmit={(event) => {
                event.preventDefault();
                void save(`/api/packages/${item.id}/condition`, "PATCH", {
                  statusPaket: condition,
                });
              }}
            >
              <label className="block text-sm font-semibold-exact">
                Ubah kondisi paket
                <select
                  value={condition}
                  onChange={(event) =>
                    setCondition(event.target.value as PackageStatus)
                  }
                  className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 text-sm font-normal"
                >
                  {Object.entries(packageStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-xs text-muted-foreground">
                PENDING, BATAL, dan DUPLIKAT akan menandai paket perlu
                diamankan. Pemulihan prefix hanya dapat dilakukan jika cocok
                dengan tepat satu ekspedisi.
              </p>
              <Button type="submit" disabled={saving || condition === item.statusPaket}>
                {saving ? "Menyimpan..." : "Simpan kondisi"}
              </Button>
            </form>
          )}
          {role === "seller" && item.barcode === null && (
            <form
              className="space-y-3 border-t border-line pt-5"
              onSubmit={(event) => {
                event.preventDefault();
                void save(`/api/packages/${item.id}/barcode`, "PATCH", {
                  barcode,
                });
              }}
            >
              <label className="block text-sm font-semibold-exact">
                Tambahkan resi
                <Input
                  value={barcode}
                  onChange={(event) => setBarcode(event.target.value)}
                  maxLength={200}
                  required
                  className="mt-2"
                  placeholder="Masukkan nomor resi"
                />
              </label>
              <p className="text-xs text-muted-foreground">
                Resi yang sudah terisi tidak dapat ditimpa. Prefix akan
                dikenali otomatis jika cocok dengan tepat satu aturan.
              </p>
              <Button type="submit" disabled={saving || !barcode.trim()}>
                {saving ? "Menyimpan..." : "Simpan resi"}
              </Button>
            </form>
          )}
          {message && (
            <p role="status" className="rounded-lg bg-brand-soft p-3 text-sm text-brand">
              {message}
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
