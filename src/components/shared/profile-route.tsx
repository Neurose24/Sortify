import { redirect } from "next/navigation";
import { ProfilePage } from "@/components/shared/profile-page";
import { getCurrentUser } from "@/lib/auth";
import { RequestTimeBoundary } from "@/lib/page-auth";

export function ProfileRoute({
  role,
}: {
  role: "ADMIN" | "SELLER" | "PETUGAS";
}) {
  return (
    <RequestTimeBoundary
      render={async () => {
        const user = await getCurrentUser();
        if (!user || user.role !== role) {
          redirect("/login");
        }

        const roleName = {
          ADMIN: "admin",
          SELLER: "seller",
          PETUGAS: "petugas",
        } as const;
        return <ProfilePage role={roleName[role]} user={user} />;
      }}
    />
  );
}
