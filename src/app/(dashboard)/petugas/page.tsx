import { redirect } from "next/navigation";
import { OperationalDashboard } from "@/components/shared/operational-dashboard";
import { getCurrentUser } from "@/lib/auth";
import { RequestTimeBoundary } from "@/lib/page-auth";
import { getOperationalOverview } from "@/services/dashboard.service";

export default function Page() {
  return (
    <RequestTimeBoundary
      render={async () => {
        const user = await getCurrentUser();

        if (!user || user.role !== "PETUGAS") {
          redirect("/login");
        }

        const data = await getOperationalOverview(user.role, user.id);

        return (
          <OperationalDashboard
            role="petugas"
            userName={user.nama}
            data={data}
          />
        );
      }}
    />
  );
}
