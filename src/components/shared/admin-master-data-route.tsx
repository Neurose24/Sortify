import { redirect } from "next/navigation";
import { AdminMasterDataPage } from "@/components/shared/admin-master-data-page";
import { getCurrentUser } from "@/lib/auth";
import { RequestTimeBoundary } from "@/lib/page-auth";
import { getMasterDataPageData } from "@/services/admin-master-data.service";
import type { MasterDataResource } from "@/validators/master-data.validator";

export function AdminMasterDataRoute({
  resource,
}: {
  resource: MasterDataResource;
}) {
  return (
    <RequestTimeBoundary
      render={async () => {
        const user = await getCurrentUser();
        if (!user || user.role !== "ADMIN") {
          redirect("/login");
        }

        const { rows, options } = await getMasterDataPageData(resource);
        return (
          <AdminMasterDataPage
            resource={resource}
            userName={user.nama}
            currentUserId={user.id}
            rows={rows}
            options={options}
          />
        );
      }}
    />
  );
}
