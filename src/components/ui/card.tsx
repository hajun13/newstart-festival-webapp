import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md border-2 border-ink/15 bg-linen p-4 shadow-cut",
        className
      )}
      {...props}
    />
  );
}
