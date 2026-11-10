import type { ReactNode } from "react";
import { PageAuthBoundary } from "@/lib/page-auth";

type PetugasLayoutProps = {
  children: ReactNode;
};

export default async function PetugasLayout({
  children,
}: PetugasLayoutProps) {
  return (
    <PageAuthBoundary allowedRoles={["PETUGAS"]}>
      {children}
    </PageAuthBoundary>
  );
}