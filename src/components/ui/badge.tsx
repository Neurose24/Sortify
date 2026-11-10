import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "neutral";
const tones: Record<Tone, string> = {
  success: "bg-[#e5f3ee] text-[#087f5b]",
  warning: "bg-[#fff2d8] text-[#9a6300]",
  danger: "bg-[#fdf0f0] text-[#b54747]",
  neutral: "bg-[#eef2f0] text-[#687770]",
};

export function Badge({
  tone = "success",
  className,
  ...props
}: React.ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-1 text-[11px] leading-none",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
