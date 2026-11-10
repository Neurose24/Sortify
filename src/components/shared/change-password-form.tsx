"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ChangePasswordForm() {
  const [values, setValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  function updateValue(name: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setSuccess(false);

    try {
      const response = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as {
        success: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        setMessage(result.message ?? "Password gagal diperbarui.");
        return;
      }

      setSuccess(true);
      setMessage(result.message ?? "Password berhasil diperbarui.");
      setValues({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      setMessage("Tidak dapat menghubungi server. Coba kembali.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h3 className="font-semibold-exact">Ganti password</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Masukkan password saat ini untuk mengatur password baru. Sesi lain
          akan dikeluarkan setelah perubahan berhasil.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium-exact sm:col-span-2">
          Password saat ini
          <Input
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
            className="mt-2"
            value={values.currentPassword}
            onChange={(event) =>
              updateValue("currentPassword", event.target.value)
            }
          />
        </label>
        <label className="block text-sm font-medium-exact">
          Password baru
          <Input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            className="mt-2"
            value={values.newPassword}
            onChange={(event) => updateValue("newPassword", event.target.value)}
          />
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            Minimal 8 karakter.
          </span>
        </label>
        <label className="block text-sm font-medium-exact">
          Konfirmasi password baru
          <Input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            className="mt-2"
            value={values.confirmPassword}
            onChange={(event) =>
              updateValue("confirmPassword", event.target.value)
            }
          />
        </label>
      </div>
      {message && (
        <p
          role={success ? "status" : "alert"}
          className={`rounded-lg px-3 py-2 text-sm ${
            success
              ? "bg-[#e5f3ee] text-[#087f5b]"
              : "bg-[#fdf0f0] text-[#b54747]"
          }`}
        >
          {message}
        </p>
      )}
      <Button type="submit" disabled={saving}>
        {saving ? "Menyimpan..." : "Perbarui password"}
      </Button>
    </form>
  );
}
