import { redirect } from "next/navigation";
import { ScanHistoryPage } from "@/components/shared/scan-history-page";
import { getCurrentUser } from "@/lib/auth";
import { RequestTimeBoundary } from "@/lib/page-auth";
import { getScanHistory } from "@/services/scan.service";

export default function Page() {
  return (
    <RequestTimeBoundary
      render={async () => {
        const user = await getCurrentUser();

        if (!user || user.role !== "ADMIN") {
          redirect("/login");
        }

        const history = await getScanHistory(user.id, true);

        return (
          <ScanHistoryPage
            role="admin"
            userName={user.nama}
            history={history.map((item) => ({
              ...item,
              scannedAt: item.scannedAt.toISOString(),
              userName: "user" in item ? item.user.nama : user.nama,
            }))}
          />
        );
      }}
    />
  );
}
