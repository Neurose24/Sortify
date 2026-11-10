import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Barcode,
  Boxes,
  CircleCheck,
  Package,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DashboardShell, PageHeading } from "./dashboard-shell";
import type { ReportFilters } from "@/validators/report.validator";

type Overview = Awaited<
  ReturnType<typeof import("@/services/dashboard.service").getOperationalOverview>
>;
type Role = "admin" | "seller" | "petugas";
type StatusCount = { status: string; count: number };
type ReportFilterChoices = {
  stores: Array<{
    id: string;
    nama: string;
    marketplaceId: string;
    marketplace: { nama: string };
  }>;
  marketplaces: Array<{ id: string; nama: string }>;
  expeditions: Array<{ id: string; nama: string }>;
};

const conditionLabels: Record<string, string> = {
  NORMAL: "Normal",
  PENDING: "Pending",
  BATAL: "Batal",
  DUPLIKAT: "Duplikat",
  PREFIX_TIDAK_DIKENAL: "Prefix tidak dikenal",
};

const resultLabels: Record<string, string> = {
  BERHASIL: "Berhasil",
  BARCODE_TIDAK_DIKENAL: "Barcode tidak dikenal",
  PREFIX_TIDAK_DIKENAL: "Prefix tidak dikenal",
  SUDAH_PERNAH_DISCAN: "Sudah pernah discan",
  PAKET_PENDING: "Paket pending",
  PAKET_BATAL: "Paket batal",
  PAKET_DUPLIKAT: "Paket duplikat",
  GAGAL: "Gagal",
};

function resultTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "BERHASIL") return "success";
  if (status === "GAGAL" || status === "PAKET_BATAL" || status === "PAKET_DUPLIKAT") {
    return "danger";
  }
  if (status === "SUDAH_PERNAH_DISCAN") return "neutral";
  return "warning";
}

function formatScannedAt(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function CountList({
  title,
  items,
  labels,
}: {
  title: string;
  items: StatusCount[];
  labels: Record<string, string>;
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-semibold-exact">{title}</h2>
        <span className="text-xs text-muted-foreground">{total} data</span>
      </div>
      {total === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Belum ada data pada periode ini.
        </p>
      ) : (
        <div className="space-y-4">
          {items
            .filter((item) => item.count > 0)
            .map((item) => (
              <div key={item.status}>
                <div className="mb-2 flex justify-between gap-3 text-sm">
                  <span>{labels[item.status] ?? item.status}</span>
                  <span className="font-medium-exact">{item.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-canvas">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${Math.max((item.count / total) * 100, 2)}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      )}
    </Card>
  );
}

export function OperationalDashboard({
  role,
  userName,
  data,
  reports = false,
  reportFilters,
  reportFilterChoices,
  reportFilterError,
}: {
  role: Role;
  userName: string;
  data: Overview;
  reports?: boolean;
  reportFilters?: ReportFilters;
  reportFilterChoices?: ReportFilterChoices;
  reportFilterError?: string | null;
}) {
  const isPetugas = role === "petugas";
  const packageOverview = data.packages;
  const metrics = isPetugas
    ? [
        { label: "Scan hari ini", value: data.scans.today, icon: Barcode },
        { label: "Scan berhasil · 7 hari", value: data.scans.successful, icon: CircleCheck },
        { label: "Anomali · 7 hari", value: data.scans.anomalies, icon: AlertTriangle },
      ]
    : [
        { label: "Total paket", value: packageOverview?.total ?? 0, icon: Package },
        { label: "Sudah discan", value: packageOverview?.scanned ?? 0, icon: CircleCheck },
        {
          label: "Perlu diamankan",
          value: packageOverview?.needsSecurity ?? 0,
          icon: ShieldAlert,
        },
      ];
  const actionHref = {
    admin: "/admin/packages",
    seller: "/seller/orders",
    petugas: "/petugas/scan",
  }[role];
  const historyHref = {
    admin: "/admin/scans",
    seller: "/seller/orders",
    petugas: "/petugas/history",
  }[role];
  const historyLabel = role === "seller" ? "Paket" : "Riwayat";
  const actionLabel = role === "petugas" ? "Mulai scan" : "Lihat paket";
  const maximumTrend = Math.max(...data.scans.trend.map((day) => day.count), 1);
  const title = reports ? "Laporan operasional" : "Dashboard";
  const exportQuery = reportFilters ? new URLSearchParams(reportFilters).toString() : "";
  const exportHref = `/api/reports/export${exportQuery ? `?${exportQuery}` : ""}`;

  return (
    <DashboardShell role={role} section={reports ? "Laporan" : "Dashboard"} userName={userName}>
      <div className="mx-auto max-w-[1500px] p-5 sm:p-8 lg:p-10">
        <PageHeading
          title={title}
          description={
            reports
              ? "Ringkasan paket dan scan sesuai filter laporan yang dipilih."
              : "Pantau kondisi paket dan aktivitas operasional terbaru."
          }
          action={
            <Link
              href={actionHref}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium-exact text-white hover:opacity-90"
            >
              {actionLabel}
              <ArrowRight className="size-4" />
            </Link>
          }
        />

        {reports && reportFilters && reportFilterChoices && (
          <Card className="mb-6 p-5 sm:p-6">
            <form method="get" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <label>
                <span className="mb-2 block text-xs font-medium-exact">Toko</span>
                <select
                  name="storeId"
                  defaultValue={reportFilters.storeId}
                  className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm"
                >
                  <option value="">Semua toko</option>
                  {reportFilterChoices.stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.nama} · {store.marketplace.nama}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-xs font-medium-exact">Marketplace</span>
                <select
                  name="marketplaceId"
                  defaultValue={reportFilters.marketplaceId}
                  className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm"
                >
                  <option value="">Semua marketplace</option>
                  {reportFilterChoices.marketplaces.map((marketplace) => (
                    <option key={marketplace.id} value={marketplace.id}>
                      {marketplace.nama}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-xs font-medium-exact">Ekspedisi</span>
                <select
                  name="expeditionId"
                  defaultValue={reportFilters.expeditionId}
                  className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm"
                >
                  <option value="">Semua ekspedisi</option>
                  {reportFilterChoices.expeditions.map((expedition) => (
                    <option key={expedition.id} value={expedition.id}>
                      {expedition.nama}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-xs font-medium-exact">Kondisi paket</span>
                <select
                  name="status"
                  defaultValue={reportFilters.status}
                  className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm"
                >
                  <option value="">Semua kondisi</option>
                  {Object.entries(conditionLabels).map(([status, label]) => (
                    <option key={status} value={status}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-xs font-medium-exact">Dari tanggal</span>
                <input
                  type="date"
                  name="from"
                  defaultValue={reportFilters.from}
                  className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm"
                />
              </label>
              <label>
                <span className="mb-2 block text-xs font-medium-exact">Sampai tanggal</span>
                <input
                  type="date"
                  name="to"
                  defaultValue={reportFilters.to}
                  className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm"
                />
              </label>
              <div className="flex flex-wrap items-end gap-2 sm:col-span-2 xl:col-span-4">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-medium-exact text-white hover:opacity-90"
                >
                  Terapkan filter
                </button>
                <a
                  href={role === "admin" ? "/admin/reports" : "/seller/reports"}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-line px-4 text-sm hover:bg-canvas"
                >
                  Reset filter
                </a>
                <a
                  href={exportHref}
                  className="ml-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line px-4 text-sm font-medium-exact hover:bg-canvas"
                >
                  <Package className="size-4" />
                  Ekspor Excel
                </a>
                <p className="w-full text-xs text-muted-foreground">
                  Filter tanggal berlaku pada tanggal paket dibuat dan waktu scan. Kosongkan kedua
                  tanggal untuk seluruh periode.
                </p>
                {reportFilterError && (
                  <p role="alert" className="w-full text-sm text-danger">
                    {reportFilterError}
                  </p>
                )}
              </div>
            </form>
          </Card>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {metrics.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="flex items-center gap-4 p-5 sm:p-6">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold-exact">{value.toLocaleString("id-ID")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{label}</p>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mb-6 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold-exact">Aktivitas scan</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {reports
                  ? reportFilters?.from
                    ? "Aktivitas dalam rentang tanggal terpilih"
                    : "Aktivitas scan tujuh hari terakhir"
                  : "Jumlah percobaan per hari · 7 hari terakhir"}
              </p>
            </div>
            <Activity className="size-5 text-brand" />
          </div>
          <div
            className="grid h-44 items-end gap-3 sm:gap-5"
            style={{
              gridTemplateColumns: `repeat(${data.scans.trend.length}, minmax(0, 1fr))`,
            }}
          >
            {data.scans.trend.map((day) => (
              <div
                key={day.start.toISOString()}
                className="flex h-full flex-col items-center justify-end gap-2"
              >
                <span className="text-[11px] text-muted-foreground">{day.count}</span>
                <div
                  className="w-full max-w-12 rounded-t-md bg-brand"
                  style={{
                    height: `${Math.max((day.count / maximumTrend) * 100, day.count ? 8 : 2)}%`,
                  }}
                  aria-label={`${day.date}: ${day.count} scan`}
                />
                <span className="text-center text-[10px] leading-tight text-muted-foreground">
                  {day.label}
                  <br />
                  {day.date}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          {packageOverview && (
            <CountList
              title="Kondisi paket"
              items={packageOverview.conditions}
              labels={conditionLabels}
            />
          )}
          <CountList
            title={
              reports
                ? reportFilters?.from
                  ? "Hasil scan · rentang terpilih"
                  : "Hasil scan · seluruh waktu"
                : "Hasil scan · 7 hari"
            }
            items={data.scans.results}
            labels={resultLabels}
          />
        </div>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-6 py-5">
            <div>
              <h2 className="font-semibold-exact">Aktivitas terbaru</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Maksimal 8 catatan terbaru sesuai akses akun Anda.
              </p>
            </div>
            <Link
              href={historyHref}
              className="inline-flex items-center gap-1 text-xs font-medium-exact text-brand hover:underline"
            >
              {historyLabel}
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {data.scans.recent.length === 0 ? (
            <p className="border-t border-line px-6 py-10 text-center text-sm text-muted-foreground">
              Belum ada aktivitas scan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-y border-line bg-canvas text-xs text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3.5 font-medium-exact">Waktu</th>
                    <th className="px-6 py-3.5 font-medium-exact">Barcode</th>
                    <th className="px-6 py-3.5 font-medium-exact">Pesanan / toko</th>
                    <th className="px-6 py-3.5 font-medium-exact">Hasil</th>
                  </tr>
                </thead>
                <tbody>
                  {data.scans.recent.map((scan) => (
                    <tr key={scan.id} className="border-b border-line last:border-0">
                      <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                        {formatScannedAt(scan.scannedAt)}
                      </td>
                      <td className="max-w-56 break-all px-6 py-4 font-mono-exact text-xs">
                        {scan.barcode}
                      </td>
                      <td className="px-6 py-4">
                        {scan.package ? (
                          <>
                            <p>{scan.package.nomorPesanan}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {scan.package.store.nama}
                            </p>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Paket tidak ditemukan</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={resultTone(scan.hasilScan)}>
                          {resultLabels[scan.hasilScan] ?? scan.hasilScan}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        {reports && (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Boxes className="size-4" />
            Data paket dihitung dari awal penggunaan; tren scan menggunakan zona waktu WIB.
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
