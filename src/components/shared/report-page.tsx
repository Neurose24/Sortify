import { redirect } from "next/navigation";
import { OperationalDashboard } from "@/components/shared/operational-dashboard";
import { getCurrentUser } from "@/lib/auth";
import { RequestTimeBoundary } from "@/lib/page-auth";
import {
  getDefaultReportDateRange,
  getOperationalOverview,
  getReportFilterChoices,
} from "@/services/dashboard.service";
import { reportFilterSchema } from "@/validators/report.validator";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function ReportPage({
  role,
  searchParams,
}: {
  role: "admin" | "seller";
  searchParams: Promise<SearchParams>;
}) {
  return (
    <RequestTimeBoundary
      render={async () => {
        const user = await getCurrentUser();
        const expectedRole = role === "admin" ? "ADMIN" : "SELLER";

        if (!user || user.role !== expectedRole) {
          redirect("/login");
        }

        const params = await searchParams;
        const hasDateParams =
          Object.hasOwn(params, "from") || Object.hasOwn(params, "to");
        const defaults = getDefaultReportDateRange();
        const parsed = reportFilterSchema.safeParse({
          storeId: firstValue(params.storeId),
          marketplaceId: firstValue(params.marketplaceId),
          expeditionId: firstValue(params.expeditionId),
          status: firstValue(params.status),
          from: hasDateParams ? firstValue(params.from) : defaults.from,
          to: hasDateParams ? firstValue(params.to) : defaults.to,
        });
        const filters = parsed.success
          ? parsed.data
          : reportFilterSchema.parse({ from: defaults.from, to: defaults.to });
        const [data, choices] = await Promise.all([
          getOperationalOverview(user.role, user.id, filters),
          getReportFilterChoices(role === "seller" ? user.id : undefined),
        ]);
        const filterError = parsed.success
          ? null
          : "Filter tidak valid. Nilai tanggal harus benar dan tanggal awal tidak boleh melewati tanggal akhir.";

        return (
          <OperationalDashboard
            role={role}
            userName={user.nama}
            data={data}
            reports
            reportFilters={filters}
            reportFilterChoices={choices}
            reportFilterError={filterError}
          />
        );
      }}
    />
  );
}
