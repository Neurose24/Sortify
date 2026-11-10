import type { ReactNode } from "react";
import { PageAuthBoundary } from "@/lib/page-auth";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({
  children,
}: AdminLayoutProps) {
  return (
    <PageAuthBoundary allowedRoles={["ADMIN"]}>
      {children}
    </PageAuthBoundary>
  );
}
