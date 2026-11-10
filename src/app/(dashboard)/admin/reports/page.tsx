import { ReportPage } from "@/components/shared/report-page";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ReportPage role="admin" searchParams={searchParams} />;
}
