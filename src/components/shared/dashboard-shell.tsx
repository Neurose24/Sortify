"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Building2,
  ChevronRight,
  History,
  LayoutDashboard,
  Menu,
  Package,
  ScanLine,
  SlidersHorizontal,
  Store,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Role = "admin" | "seller" | "petugas";

const roleMeta = {
  admin: { name: "Nadia Putri", label: "Admin" },
  seller: { name: "Aditya Pratama", label: "Seller" },
  petugas: { name: "Rani Wulandari", label: "Petugas" },
};

const menus = {
  admin: [
    {
      group: "RINGKASAN",
      label: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      group: "OPERASIONAL",
      label: "Paket",
      href: "/admin/packages",
      icon: Package,
    },
    {
      group: "MANAJEMEN",
      label: "Marketplace",
      href: "/admin/marketplaces",
      icon: Boxes,
    },
    { label: "Toko", href: "/admin/stores", icon: Store },
    { label: "Ekspedisi", href: "/admin/expeditions", icon: Building2 },
    {
      label: "Aturan Prefix",
      href: "/admin/prefix-rules",
      icon: SlidersHorizontal,
    },
    { label: "Pengguna", href: "/admin/users", icon: UsersRound },
    {
      group: "LAPORAN",
      label: "Laporan",
      href: "/admin/reports",
      icon: BarChart3,
    },
    {
      label: "Riwayat Scan",
      href: "/admin/scans",
      icon: History,
    },
    {
      group: "AKUN",
      label: "Profil Saya",
      href: "/admin/profile",
      icon: UserRound,
    },
  ],
  seller: [
    {
      group: "RINGKASAN",
      label: "Dashboard",
      href: "/seller",
      icon: LayoutDashboard,
    },
    {
      group: "OPERASIONAL",
      label: "Paket",
      href: "/seller/orders",
      icon: Package,
    },
    {
      group: "LAPORAN",
      label: "Laporan",
      href: "/seller/reports",
      icon: BarChart3,
    },
    {
      group: "AKUN",
      label: "Profil Saya",
      href: "/seller/profile",
      icon: UserRound,
    },
  ],
  petugas: [
    {
      group: "RINGKASAN",
      label: "Dashboard",
      href: "/petugas",
      icon: LayoutDashboard,
    },
    {
      group: "OPERASIONAL",
      label: "Scan Paket",
      href: "/petugas/scan",
      icon: ScanLine,
    },
    { label: "Riwayat Scan", href: "/petugas/history", icon: History },
    {
      group: "AKUN",
      label: "Profil Saya",
      href: "/petugas/profile",
      icon: UserRound,
    },
  ],
};

export function DashboardShell({
  role,
  section,
  children,
  userName,
}: {
  role: Role;
  section: string;
  children: React.ReactNode;
  userName?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const user = roleMeta[role];

  const sidebar = (
    <aside className="flex h-full w-[177px] flex-col border-r border-line bg-white px-5 py-7">
      <div className="mb-11 flex items-center gap-2 px-2">
        <img src="/assets/2980c.svg" alt="" className="size-[34px]" />
        <span className="text-[25px] leading-none">sortify</span>
      </div>
      <nav className="space-y-1">
        {menus[role].map((item, index) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <div key={item.href}>
              {item.group && (
                <p
                  className={cn(
                    "mb-3 mt-5 text-[9px] font-medium-exact tracking-[0.18em] text-[#8b9791]",
                    index === 0 && "mt-0",
                  )}
                >
                  {item.group}
                </p>
              )}
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-lg px-3 text-[13px] text-muted-foreground hover:bg-canvas",
                  active && "bg-brand-soft font-medium-exact text-brand",
                )}
              >
                <Icon className="size-[18px]" strokeWidth={1.6} />
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>
      <p className="mt-auto px-2 text-[9px] text-[#8b9791]">
        Sortify · Ruang kerja terpusat
      </p>
    </aside>
  );

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
        {sidebar}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Tutup menu"
            className="absolute inset-0 bg-ink/25"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-[260px] bg-white">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 z-10"
              onClick={() => setOpen(false)}
            >
              <X className="size-5" />
            </Button>
            {sidebar}
          </div>
        </div>
      )}
      <div className="lg:pl-[177px]">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-line bg-white px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3 text-[13px]">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <span className="hidden text-muted-foreground sm:inline">
              Ruang kerja
            </span>
            <ChevronRight className="hidden size-3.5 text-muted-foreground sm:block" />
            <span className="font-medium-exact">{section}</span>
          </div>
          <div className="text-right leading-[1.45]">
            <p className="text-[13px] font-semibold-exact">
              {userName ?? user.name}
            </p>
            <p className="text-[11px] text-muted-foreground">{user.label}</p>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-[30px] font-medium-exact leading-tight tracking-[-0.02em]">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
