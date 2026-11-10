import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-line bg-white px-[13px] text-sm text-ink placeholder:text-[#8b9791] focus:border-brand focus:ring-2 focus:ring-brand/10",
        className,
      )}
      {...props}
    />
  );
}
