import { redirect } from "next/navigation";
import { PackagePage } from "@/components/shared/package-table";
import { getCurrentUser } from "@/lib/auth";
import { RequestTimeBoundary } from "@/lib/page-auth";
import { listPackagesForAdmin } from "@/services/package.service";
import { listAllStores } from "@/services/store.service";

export default function Page() {
  return (
    <RequestTimeBoundary
      render={async () => {
        const user = await getCurrentUser();

        if (!user || user.role !== "ADMIN") {
          redirect("/login");
        }

        const [packages, stores] = await Promise.all([
          listPackagesForAdmin(),
          listAllStores(),
        ]);

        return (
          <PackagePage
            role="admin"
            userName={user.nama}
            stores={stores}
            packages={packages.map((item) => ({
              ...item,
              createdAt: item.createdAt.toISOString(),
              updatedAt: item.updatedAt.toISOString(),
            }))}
          />
        );
      }}
    />
  );
}
