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

        if (!user || user.role !== "PETUGAS") {
          redirect("/login");
        }

        const history = await getScanHistory(user.id, false);

        return (
          <ScanHistoryPage
            role="petugas"
            userName={user.nama}
            history={history.map((item) => ({
              ...item,
              scannedAt: item.scannedAt.toISOString(),
              userName: user.nama,
            }))}
          />
        );
      }}
    />
  );
}
