import { KeyRound, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DashboardShell, PageHeading } from "./dashboard-shell";
import { ChangePasswordForm } from "./change-password-form";
import { LogoutButton } from "./logout-button";

const roleLabels = {
  ADMIN: "Admin",
  SELLER: "Seller",
  PETUGAS: "Petugas",
} as const;

export function ProfilePage({
  role,
  user,
}: {
  role: "admin" | "seller" | "petugas";
  user: {
    nama: string;
    username: string;
    role: keyof typeof roleLabels;
  };
}) {
  return (
    <DashboardShell
      role={role}
      section="Profil Saya"
      userName={user.nama}
    >
      <div className="mx-auto max-w-[1100px] p-5 sm:p-8 lg:p-10">
        <PageHeading
          title="Profil Saya"
          description="Lihat identitas akun dan kelola password."
        />
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card className="h-fit overflow-hidden">
            <div className="flex items-center gap-3 border-b border-line p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand">
                <UserRound className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold-exact">Informasi akun</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Data dari akun yang sedang login.
                </p>
              </div>
            </div>
            <dl className="space-y-5 p-6">
              <div>
                <dt className="text-xs text-muted-foreground">Nama lengkap</dt>
                <dd className="mt-1.5 font-medium-exact">{user.nama}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Username</dt>
                <dd className="mt-1.5 font-medium-exact">{user.username}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Role</dt>
                <dd className="mt-1.5">
                  <Badge tone="neutral">{roleLabels[user.role]}</Badge>
                </dd>
              </div>
            </dl>
            <LogoutButton />
          </Card>
          <Card className="overflow-hidden">
            <div className="flex items-center gap-3 border-b border-line p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand">
                <KeyRound className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold-exact">Keamanan akun</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Perbarui password akun Anda.
                </p>
              </div>
            </div>
            <div className="p-6">
              <ChangePasswordForm />
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
