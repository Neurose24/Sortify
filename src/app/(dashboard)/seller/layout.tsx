import type { ReactNode } from "react";
import { PageAuthBoundary } from "@/lib/page-auth";

type SellerLayoutProps = {
  children: ReactNode;
};

export default async function SellerLayout({
  children,
}: SellerLayoutProps) {
  return (
    <PageAuthBoundary allowedRoles={["SELLER"]}>
      {children}
    </PageAuthBoundary>
  );
}