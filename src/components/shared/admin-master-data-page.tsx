"use client";

import { Building2, Boxes, KeyRound, Pencil, Plus, Search, Store, UsersRound } from "lucide-react";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DashboardShell, PageHeading } from "./dashboard-shell";
import type { MasterDataResource } from "@/validators/master-data.validator";

type MasterDataRow = {
  id: string;
  title: string;
  subtitle: string;
  fields: Record<string, string>;
  counts: Record<string, number>;
  createdAt: string;
};

type MasterDataOptions = {
  marketplaces: Array<{ id: string; label: string }>;
  sellers: Array<{ id: string; label: string }>;
  expeditions: Array<{ id: string; label: string }>;
};

type FieldDefinition = {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "password" | "number" | "select";
  required?: boolean;
  options?: keyof MasterDataOptions | Array<{ id: string; label: string }>;
  help?: string;
};

const pageDefinitions: Record<
  MasterDataResource,
  {
    title: string;
    description: string;
    icon: typeof Store;
    fields: FieldDefinition[];
    noun: string;
    badge?: (row: MasterDataRow) => string | null;
  }
> = {
  marketplaces: {
    title: "Marketplace",
    description: "Kelola nama marketplace dan lihat toko yang menggunakannya.",
    icon: Boxes,
    noun: "marketplace",
    fields: [
      {
        name: "nama",
        label: "Nama marketplace",
        placeholder: "Masukkan nama marketplace",
        required: true,
      },
    ],
  },
  stores: {
    title: "Toko",
    description: "Kelola toko, marketplace, dan Seller yang bertanggung jawab.",
    icon: Store,
    noun: "toko",
    fields: [
      { name: "nama", label: "Nama toko", required: true },
      {
        name: "marketplaceId",
        label: "Marketplace",
        type: "select",
        options: "marketplaces",
        required: true,
      },
      {
        name: "sellerId",
        label: "Seller",
        type: "select",
        options: "sellers",
        required: true,
      },
    ],
  },
  expeditions: {
    title: "Ekspedisi",
    description: "Kelola ekspedisi yang dikenali oleh sistem.",
    icon: Building2,
    noun: "ekspedisi",
    fields: [
      {
        name: "nama",
        label: "Nama ekspedisi",
        placeholder: "Masukkan nama ekspedisi",
        required: true,
      },
    ],
  },
  "prefix-rules": {
    title: "Aturan Prefix",
    description: "Atur pola awalan, akhiran, dan panjang barcode ekspedisi.",
    icon: KeyRound,
    noun: "aturan prefix",
    fields: [
      {
        name: "expeditionId",
        label: "Ekspedisi",
        type: "select",
        options: "expeditions",
        required: true,
      },
      {
        name: "awalan",
        label: "Awalan barcode",
        placeholder: "Contoh: JNE",
      },
      {
        name: "akhiran",
        label: "Akhiran barcode",
        placeholder: "Opsional",
      },
      {
        name: "panjang",
        label: "Panjang barcode",
        type: "number",
        placeholder: "Opsional",
        help: "Panjang barcode yang didukung maksimal 1.000 karakter.",
      },
    ],
  },
  users: {
    title: "Pengguna",
    description: "Kelola akun Admin, Seller, dan Petugas.",
    icon: UsersRound,
    noun: "pengguna",
    badge: (row) =>
      ({ ADMIN: "Admin", SELLER: "Seller", PETUGAS: "Petugas" })[row.fields.role] ??
      row.fields.role,
    fields: [
      { name: "nama", label: "Nama lengkap", required: true },
      {
        name: "username",
        label: "Username",
        required: true,
        help: "Username harus unik.",
      },
      {
        name: "role",
        label: "Role",
        type: "select",
        required: true,
        options: [
          { id: "ADMIN", label: "Admin" },
          { id: "SELLER", label: "Seller" },
          { id: "PETUGAS", label: "Petugas" },
        ],
      },
      {
        name: "password",
        label: "Password",
        type: "password",
        required: false,
        help: "Minimal 8 karakter. Saat edit, kosongkan bila tidak ingin mengganti password. Mengganti password akan mengeluarkan akun dari semua sesi.",
      },
    ],
  },
};

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function AdminMasterDataPage({
  resource,
  userName,
  currentUserId,
  rows,
  options,
}: {
  resource: MasterDataResource;
  userName: string;
  currentUserId: string;
  rows: MasterDataRow[];
  options: MasterDataOptions;
}) {
  const [query, setQuery] = useState("");
  const definition = pageDefinitions[resource];
  const Icon = definition.icon;
  const shown = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
    if (!normalizedQuery) return rows;
    return rows.filter((row) =>
      [row.title, row.subtitle, ...Object.values(row.fields)]
        .join(" ")
        .toLocaleLowerCase("id-ID")
        .includes(normalizedQuery),
    );
  }, [query, rows]);
  const relationTotal = rows.reduce(
    (sum, row) => sum + Object.values(row.counts).reduce((count, value) => count + value, 0),
    0,
  );

  return (
    <DashboardShell role="admin" section={`Manajemen / ${definition.title}`} userName={userName}>
      <div className="mx-auto max-w-[1500px] p-5 sm:p-8 lg:p-10">
        <PageHeading
          title={definition.title}
          description={definition.description}
          action={
            <MasterDataForm resource={resource} options={options} currentUserId={currentUserId}>
              <Button>
                <Plus className="size-4" />
                Tambah {definition.noun}
              </Button>
            </MasterDataForm>
          }
        />
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Card className="flex items-center gap-4 p-5">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold-exact">{rows.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">{definition.title} terdaftar</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4 p-5">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand">
              <Boxes className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold-exact">{relationTotal}</p>
              <p className="mt-1 text-sm text-muted-foreground">Total relasi / aktivitas terkait</p>
            </div>
          </Card>
        </div>
        <Card className="overflow-hidden">
          <div className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-semibold-exact">
                Daftar {definition.title.toLocaleLowerCase("id-ID")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Data aktual dari database. Perubahan relasi divalidasi oleh server.
              </p>
            </div>
            <label className="relative w-full sm:max-w-[320px]">
              <span className="mb-2 block text-xs font-medium-exact">Cari {definition.noun}</span>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Cari ${definition.title.toLocaleLowerCase("id-ID")}...`}
                className="pr-10"
              />
              <Search className="absolute bottom-3 right-3 size-4 text-muted-foreground" />
            </label>
          </div>
          {shown.length === 0 ? (
            <p className="border-t border-line px-6 py-12 text-center text-sm text-muted-foreground">
              {rows.length === 0
                ? `Belum ada ${definition.noun}. Tambahkan data pertama.`
                : "Tidak ada data yang cocok dengan pencarian."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-y border-line bg-canvas text-xs text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium-exact">Nama / detail</th>
                    <th className="px-6 py-4 font-medium-exact">Relasi</th>
                    <th className="px-6 py-4 font-medium-exact">Tanggal dibuat</th>
                    <th className="px-6 py-4 font-medium-exact">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((row) => (
                    <tr key={row.id} className="border-b border-line last:border-0">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium-exact">{row.title}</span>
                          {definition.badge && (
                            <Badge tone="neutral">{definition.badge(row)}</Badge>
                          )}
                        </div>
                        <p className="mt-1 max-w-[560px] text-xs text-muted-foreground">
                          {row.subtitle}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {Object.entries(row.counts).length ? (
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(row.counts).map(([label, count]) => (
                              <Badge key={label} tone="neutral">
                                {label}: {count}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs text-muted-foreground">
                        {formatCreatedAt(row.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <MasterDataForm
                          resource={resource}
                          row={row}
                          options={options}
                          currentUserId={currentUserId}
                        >
                          <Button variant="secondary" size="sm">
                            <Pencil className="size-3.5" />
                            Edit
                          </Button>
                        </MasterDataForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="border-t border-line px-6 py-4 text-xs text-muted-foreground">
            Menampilkan {shown.length} dari {rows.length} data
          </div>
        </Card>
        <p className="mt-4 text-xs text-muted-foreground">
          Penghapusan data tidak tersedia agar relasi paket, toko, dan riwayat operasional tetap
          terjaga.
        </p>
      </div>
    </DashboardShell>
  );
}

function MasterDataForm({
  children,
  resource,
  row,
  options,
  currentUserId,
}: {
  children: ReactNode;
  resource: MasterDataResource;
  row?: MasterDataRow;
  options: MasterDataOptions;
  currentUserId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(row?.fields ?? {});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const definition = pageDefinitions[resource];
  const ownAccount = row?.id === currentUserId && resource === "users";

  function updateValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        row
          ? `/api/admin/master-data/${resource}/${encodeURIComponent(row.id)}`
          : `/api/admin/master-data/${resource}`,
        {
          method: row ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      const result = (await response.json()) as {
        success: boolean;
        message?: string;
      };
      if (!response.ok || !result.success) {
        setError(result.message ?? "Data gagal disimpan.");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  function getOptions(field: FieldDefinition) {
    if (!field.options) return [];
    return Array.isArray(field.options) ? field.options : options[field.options];
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setValues(row?.fields ?? {});
          setError("");
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[620px]">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>
              {row ? `Edit ${definition.noun}` : `Tambah ${definition.noun}`}
            </DialogTitle>
            <DialogDescription>
              Perubahan divalidasi dan disimpan langsung ke database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-6">
            {definition.fields.map((field) => {
              const value = values[field.name] ?? "";
              const fieldOptions = getOptions(field);
              const isOwnRole = ownAccount && field.name === "role";
              return (
                <label key={field.name} className="block text-sm font-medium-exact">
                  {field.label}
                  {field.required && (
                    <span className="ml-1 text-brand" aria-hidden="true">
                      *
                    </span>
                  )}
                  {field.type === "select" ? (
                    <select
                      required={field.required}
                      disabled={isOwnRole}
                      value={value}
                      onChange={(event) => updateValue(field.name, event.target.value)}
                      className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 text-sm disabled:bg-canvas"
                    >
                      <option value="">Pilih {field.label.toLocaleLowerCase("id-ID")}</option>
                      {fieldOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      className="mt-2"
                      type={field.type ?? "text"}
                      min={field.type === "number" ? 1 : undefined}
                      required={field.name === "password" && row ? false : field.required}
                      value={value}
                      placeholder={
                        field.name === "password" && row
                          ? "Kosongkan jika tidak ingin mengganti"
                          : field.placeholder
                      }
                      onChange={(event) => updateValue(field.name, event.target.value)}
                    />
                  )}
                  {field.help && (
                    <span className="mt-1.5 block text-xs font-normal text-muted-foreground">
                      {field.help}
                    </span>
                  )}
                  {resource === "prefix-rules" && field.name === "panjang" && (
                    <span className="mt-1.5 block text-xs font-normal text-muted-foreground">
                      Isi minimal satu kriteria: awalan, akhiran, atau panjang.
                    </span>
                  )}
                  {isOwnRole && (
                    <span className="mt-1.5 block text-xs font-normal text-muted-foreground">
                      Role akun Admin yang sedang dipakai tidak dapat diubah.
                    </span>
                  )}
                </label>
              );
            })}
            {resource === "stores" && options.marketplaces.length === 0 && (
              <p className="text-sm text-[#9a6300]">
                Buat marketplace terlebih dahulu sebelum menambahkan toko.
              </p>
            )}
            {resource === "stores" && options.sellers.length === 0 && (
              <p className="text-sm text-[#9a6300]">
                Buat akun Seller terlebih dahulu sebelum menambahkan toko.
              </p>
            )}
            {resource === "prefix-rules" && options.expeditions.length === 0 && (
              <p className="text-sm text-[#9a6300]">
                Buat ekspedisi terlebih dahulu sebelum menambahkan aturan.
              </p>
            )}
            {error && (
              <p role="alert" className="rounded-lg bg-[#fdf0f0] px-3 py-2 text-sm text-[#b54747]">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={saving}>
                Batal
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : row ? "Simpan perubahan" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
