import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { getCurrentUser } from "@/lib/auth";

type AppRole = "ADMIN" | "PETUGAS" | "SELLER";

type PageAuthBoundaryProps = {
  children: ReactNode;
  allowedRoles?: readonly AppRole[];
};

type RequestTimeBoundaryProps = {
  render: () => Promise<ReactNode>;
};

const ROLE_DASHBOARD: Record<AppRole, string> = {
  ADMIN: "/admin",
  PETUGAS: "/petugas",
  SELLER: "/seller",
};

async function RequestTimePage({ render }: RequestTimeBoundaryProps) {
  await connection();
  return render();
}

export function RequestTimeBoundary({ render }: RequestTimeBoundaryProps) {
  return (
    <Suspense fallback={null}>
      <RequestTimePage render={render} />
    </Suspense>
  );
}

async function AuthenticatedPage({
  children,
  allowedRoles,
}: PageAuthBoundaryProps) {
  await connection();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(user.role as AppRole)) {
    redirect(ROLE_DASHBOARD[user.role as AppRole]);
  }

  return <>{children}</>;
}

export function PageAuthBoundary({
  children,
  allowedRoles,
}: PageAuthBoundaryProps) {
  return (
    <Suspense fallback={null}>
      <AuthenticatedPage allowedRoles={allowedRoles}>
        {children}
      </AuthenticatedPage>
    </Suspense>
  );
}