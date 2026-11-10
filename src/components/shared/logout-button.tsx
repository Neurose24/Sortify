"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setError("");
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        setError(result.message ?? "Logout gagal. Silakan coba lagi.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server. Silakan coba lagi.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="border-t border-line p-6">
      {error && (
        <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <Button
        type="button"
        variant="outlineDanger"
        onClick={() => void logout()}
        disabled={loggingOut}
      >
        <LogOut className="size-4" />
        {loggingOut ? "Keluar..." : "Logout"}
      </Button>
    </div>
  );
}
