import { redirect } from "next/navigation";
import { ScanPage } from "@/components/shared/scan-page";
import { getCurrentUser } from "@/lib/auth";
import { RequestTimeBoundary } from "@/lib/page-auth";
import { getScanDashboard } from "@/services/scan.service";

export default function Page() {
  return (
    <RequestTimeBoundary
      render={async () => {
        const user = await getCurrentUser();

        if (!user || user.role !== "PETUGAS") {
          redirect("/login");
        }

        const dashboard = await getScanDashboard(user.id);

        return (
          <ScanPage
            userName={user.nama}
            today={dashboard.today}
            recent={dashboard.recent}
            attention={dashboard.attention}
          />
        );
      }}
    />
  );
}
