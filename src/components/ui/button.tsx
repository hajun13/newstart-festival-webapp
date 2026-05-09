import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "quiet";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border-2 border-transparent px-4 py-2 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-ink disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "border-ink bg-ink text-paper shadow-[4px_4px_0_rgba(21,23,19,0.22)] hover:-translate-y-0.5 hover:bg-night",
        variant === "secondary" && "border-ink/25 bg-linen text-ink hover:border-ink",
        variant === "danger" && "bg-coral text-white hover:bg-coral/90",
        variant === "quiet" && "bg-transparent text-ink hover:bg-ink/5",
        className
      )}
      {...props}
    />
  );
}
