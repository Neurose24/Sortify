import { redirect } from "next/navigation";
import { PackagePage } from "@/components/shared/package-table";
import { getCurrentUser } from "@/lib/auth";
import { RequestTimeBoundary } from "@/lib/page-auth";
import { listPackagesForSeller } from "@/services/package.service";
import { listStoresForSeller } from "@/services/store.service";

export default function Page() {
  return (
    <RequestTimeBoundary
      render={async () => {
        const user = await getCurrentUser();

        if (!user || user.role !== "SELLER") {
          redirect("/login");
        }

        const [stores, packages] = await Promise.all([
          listStoresForSeller(user.id),
          listPackagesForSeller(user.id),
        ]);

        return (
          <PackagePage
            role="seller"
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
