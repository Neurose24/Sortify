import type { Prisma } from "../../generated/prisma/client";
import {
  findReportDataCounts,
  findReportFilterOptions,
  findReportPackages,
  findReportScans,
  findPackageOverview,
  findScanOverview,
} from "@/models/DashboardModel";
import type { ReportFilters } from "@/validators/report.validator";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const MAX_EXCEL_ROWS_PER_SHEET = 50_000;

function getJakartaDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function getJakartaDayStart(date: Date) {
  const parts = getJakartaDateParts(date);
  return new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), -7));
}

export async function getOperationalOverview(
  role: "ADMIN" | "SELLER" | "PETUGAS",
  userId: string,
  filters?: ReportFilters,
) {
  const todayStart = getJakartaDayStart(new Date());
  const defaultPeriodStart = new Date(todayStart.getTime() - 6 * DAY_IN_MILLISECONDS);
  const defaultPeriodEnd = new Date(todayStart.getTime() + DAY_IN_MILLISECONDS);
  const periodStart = filters?.from
    ? getJakartaDateStart(filters.from)
    : filters
      ? null
      : defaultPeriodStart;
  const periodEnd = filters?.to
    ? new Date(getJakartaDateStart(filters.to).getTime() + DAY_IN_MILLISECONDS)
    : filters
      ? null
      : defaultPeriodEnd;
  const trendStart = periodStart ?? defaultPeriodStart;
  const trendEnd = periodEnd ?? defaultPeriodEnd;
  const trendSpan = Math.max(trendEnd.getTime() - trendStart.getTime(), DAY_IN_MILLISECONDS);
  const bucketCount = Math.min(7, Math.max(1, Math.ceil(trendSpan / DAY_IN_MILLISECONDS)));
  const bucketSize = Math.ceil(trendSpan / bucketCount);
  const days = Array.from({ length: bucketCount }, (_, index) => {
    const start = new Date(trendStart.getTime() + index * bucketSize);
    const bucketEnd = index === bucketCount - 1 ? trendEnd : new Date(start.getTime() + bucketSize);
    const lastIncluded = new Date(bucketEnd.getTime() - 1);
    const startDate = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      timeZone: "Asia/Jakarta",
    }).format(start);
    const endDate = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      timeZone: "Asia/Jakarta",
    }).format(lastIncluded);
    return {
      start,
      end: bucketEnd,
      label:
        bucketCount <= 7 && trendSpan <= 7 * DAY_IN_MILLISECONDS
          ? new Intl.DateTimeFormat("id-ID", {
              weekday: "short",
              timeZone: "Asia/Jakarta",
            }).format(start)
          : "",
      date: startDate === endDate ? startDate : `${startDate}–${endDate}`,
    };
  });

  const packageRelationWhere: Prisma.PackageWhereInput = {
    ...(role === "SELLER" || filters?.storeId || filters?.marketplaceId
      ? {
          store: {
            ...(role === "SELLER" ? { sellerId: userId } : {}),
            ...(filters?.storeId ? { id: filters.storeId } : {}),
            ...(filters?.marketplaceId ? { marketplaceId: filters.marketplaceId } : {}),
          },
        }
      : {}),
    ...(filters?.expeditionId ? { expeditionId: filters.expeditionId } : {}),
    ...(filters?.status ? { statusPaket: filters.status } : {}),
  };
  const packageWhere: Prisma.PackageWhereInput = {
    ...packageRelationWhere,
    ...(periodStart || periodEnd
      ? {
          createdAt: {
            ...(periodStart ? { gte: periodStart } : {}),
            ...(periodEnd ? { lt: periodEnd } : {}),
          },
        }
      : {}),
  };
  const scanWhere: Prisma.ScanHistoryWhereInput = {
    ...(role === "PETUGAS" ? { userId } : {}),
    ...(role === "SELLER" ||
    filters?.storeId ||
    filters?.marketplaceId ||
    filters?.expeditionId ||
    filters?.status
      ? { package: { is: packageRelationWhere } }
      : {}),
  };

  const [packages, scans] = await Promise.all([
    role === "PETUGAS" ? Promise.resolve(null) : findPackageOverview(packageWhere),
    findScanOverview(scanWhere, periodStart, periodEnd, days),
  ]);

  const results = [
    "BERHASIL",
    "BARCODE_TIDAK_DIKENAL",
    "PREFIX_TIDAK_DIKENAL",
    "SUDAH_PERNAH_DISCAN",
    "PAKET_PENDING",
    "PAKET_BATAL",
    "PAKET_DUPLIKAT",
    "GAGAL",
  ].map((status) => ({
    status,
    count: scans.results.find((item) => item.status === status)?.count ?? 0,
  }));
  const successfulScans = results.find((item) => item.status === "BERHASIL")?.count ?? 0;
  const repeatedScans = results.find((item) => item.status === "SUDAH_PERNAH_DISCAN")?.count ?? 0;
  const anomalies = scans.total - successfulScans - repeatedScans;

  return {
    packages,
    scans: {
      total: scans.total,
      successful: successfulScans,
      anomalies,
      today: scans.dailyCounts[6] ?? 0,
      results,
      trend: days.map((day, index) => ({
        ...day,
        count: scans.dailyCounts[index] ?? 0,
      })),
      recent: scans.recent,
    },
    filters: filters ?? null,
  };
}

function getJakartaDateStart(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, -7));
}

function getJakartaDateLabel(date: Date) {
  const parts = getJakartaDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getDefaultReportDateRange() {
  const todayStart = getJakartaDayStart(new Date());
  return {
    from: getJakartaDateLabel(new Date(todayStart.getTime() - 6 * DAY_IN_MILLISECONDS)),
    to: getJakartaDateLabel(todayStart),
  };
}

export async function getReportFilterChoices(sellerId?: string) {
  const [stores, marketplaces, expeditions] = await findReportFilterOptions(sellerId);
  return { stores, marketplaces, expeditions };
}

export async function getReportExportData(
  role: "ADMIN" | "SELLER",
  userId: string,
  filters: ReportFilters,
) {
  const from = filters.from ? getJakartaDateStart(filters.from) : null;
  const to = filters.to
    ? new Date(getJakartaDateStart(filters.to).getTime() + DAY_IN_MILLISECONDS)
    : null;
  const storeWhere = {
    ...(role === "SELLER" ? { sellerId: userId } : {}),
    ...(filters.storeId ? { id: filters.storeId } : {}),
    ...(filters.marketplaceId ? { marketplaceId: filters.marketplaceId } : {}),
  };
  const packageFilterWhere: Prisma.PackageWhereInput = {
    store: storeWhere,
    ...(filters.expeditionId ? { expeditionId: filters.expeditionId } : {}),
    ...(filters.status ? { statusPaket: filters.status } : {}),
  };
  const packageWhere: Prisma.PackageWhereInput = {
    ...packageFilterWhere,
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lt: to } : {}),
          },
        }
      : {}),
  };
  const scanWhere: Prisma.ScanHistoryWhereInput = {
    ...(from || to
      ? { scannedAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } }
      : {}),
    ...(role === "SELLER" ||
    filters.storeId ||
    filters.marketplaceId ||
    filters.expeditionId ||
    filters.status
      ? { package: { is: packageFilterWhere } }
      : {}),
  };

  const [packageCount, scanCount] = await findReportDataCounts(packageWhere, scanWhere);
  if (packageCount > MAX_EXCEL_ROWS_PER_SHEET || scanCount > MAX_EXCEL_ROWS_PER_SHEET) {
    return { tooManyRows: true as const, packages: [], scans: [] };
  }

  const [packages, scans] = await Promise.all([
    findReportPackages(packageWhere),
    findReportScans(scanWhere),
  ]);

  if (packages.length > MAX_EXCEL_ROWS_PER_SHEET || scans.length > MAX_EXCEL_ROWS_PER_SHEET) {
    return { tooManyRows: true as const, packages: [], scans: [] };
  }

  return { tooManyRows: false as const, packages, scans };
}
