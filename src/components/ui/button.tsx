import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "quiet";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-ink disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-ink text-paper hover:bg-moss",
        variant === "secondary" && "border border-ink/20 bg-white text-ink hover:border-ink",
        variant === "danger" && "bg-coral text-white hover:bg-coral/90",
        variant === "quiet" && "bg-transparent text-ink hover:bg-ink/5",
        className
      )}
      {...props}
    />
  );
}
