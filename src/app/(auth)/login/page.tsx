
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginResponse = {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      nama: string;
      username: string;
      role: "ADMIN" | "PETUGAS" | "SELLER";
    };
  };
};

const ROLE_DASHBOARD = {
  ADMIN: "/admin/packages",
  PETUGAS: "/petugas/scan",
  SELLER: "/seller/orders",
} as const;

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    const username = formData.get("username");
    const password = formData.get("password");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const result: LoginResponse = await response.json();

      if (!response.ok || !result.success || !result.data?.user) {
        setError(result.message || "Login gagal.");
        return;
      }

      const role = result.data.user.role;
      router.replace(ROLE_DASHBOARD[role]);
    } catch {
      setError("Tidak dapat terhubung ke server. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-5">
      <form
        onSubmit={submit}
        className="w-full max-w-[1000px] overflow-hidden rounded-xl bg-white shadow-[0_24px_80px_rgba(16,41,30,.15)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line p-6">
          <div>
            <h1 className="text-[22px] font-semibold-exact">
              Login
            </h1>
            <p className="mt-1.5 text-sm text-slate-600">
              Masukkan Username dan Password
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <img
              src="/assets/2980c.svg"
              alt=""
              className="size-[34px]"
            />
            <span className="text-[25px]">sortify</span>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <label className="block text-[13px] font-medium-exact">
            Username
            <Input
              name="username"
              required
              autoComplete="username"
              placeholder="Username"
              className="mt-2"
              disabled={loading}
            />
          </label>

          <label className="block text-[13px] font-medium-exact">
            Password
            <Input
              name="password"
              required
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              className="mt-2"
              disabled={loading}
            />
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600"
            >
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end border-t border-line px-6 py-5">
          <Button type="submit" disabled={loading}>
            {loading ? "Memproses..." : "Login"}
          </Button>
        </div>
      </form>
    </main>
  );
}
