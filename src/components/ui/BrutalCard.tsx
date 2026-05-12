import { cn } from "@/lib/utils";

interface BrutalCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  headerAction?: React.ReactNode;
  /** "default" = full shadow, "flat" = border only (for secondary/tertiary sections) */
  variant?: "default" | "flat";
}

export function BrutalCard({
  children,
  className,
  title,
  headerAction,
  variant = "default",
}: BrutalCardProps) {
  return (
    <div
      className={cn(
        "bg-white border-2 border-neutral-950",
        variant === "default" && "shadow-[4px_4px_0px_#171717]",
        className,
      )}
    >
      {title && (
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-neutral-950 bg-stone-100">
          <h3 className="font-bold text-neutral-950 text-xs uppercase tracking-widest">{title}</h3>
          {headerAction}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
