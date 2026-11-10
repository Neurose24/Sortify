import type { ReactNode } from "react";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageAuthBoundary } from "@/lib/page-auth";

type DashboardLayoutProps = {
  children: ReactNode;
};

async function RequestTimeDashboard({
  children,
}: DashboardLayoutProps) {
  await connection();

  return <PageAuthBoundary>{children}</PageAuthBoundary>;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <Suspense fallback={null}>
      <RequestTimeDashboard>{children}</RequestTimeDashboard>
    </Suspense>
  );
}
