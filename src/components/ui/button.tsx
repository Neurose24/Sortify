import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border text-sm font-semibold-exact transition-colors focus-visible:ring-2 focus-visible:ring-brand/25 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-[#087f5b] bg-[#087f5b] text-white hover:bg-[#066b4d]",
        secondary: "border-line bg-white text-ink hover:bg-canvas",
        danger: "border-[#b54747] bg-[#b54747] text-white hover:bg-[#9f3f3f]",
        outlineDanger:
          "border-[#b44242] bg-white text-[#b44242] hover:bg-[#fdf0f0]",
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:bg-brand-soft hover:text-brand",
      },
      size: {
        sm: "h-9 px-3 text-[13px]",
        default: "h-[42px] px-4",
        lg: "h-11 px-4",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
