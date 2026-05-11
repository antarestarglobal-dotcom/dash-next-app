import { cn } from "@/lib/utils";

type BadgeVariant = "preview" | "imported" | "failed" | "default";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  preview: "bg-amber-100 text-amber-950 border-amber-950",
  imported: "bg-green-100 text-green-950 border-green-950",
  failed: "bg-red-100 text-red-950 border-red-950",
  default: "bg-neutral-100 text-neutral-950 border-neutral-950",
};

interface BrutalBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function BrutalBadge({ variant = "default", children, className }: BrutalBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-semibold border-2 rounded-none uppercase tracking-wide",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
