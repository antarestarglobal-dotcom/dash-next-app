import { cn } from "@/lib/utils";

interface BrutalCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  headerAction?: React.ReactNode;
}

export function BrutalCard({ children, className, title, headerAction }: BrutalCardProps) {
  return (
    <div
      className={cn(
        "bg-white border-2 border-neutral-950 shadow-[4px_4px_0px_#171717]",
        className,
      )}
    >
      {title && (
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-neutral-950 bg-stone-100">
          <h3 className="font-bold text-neutral-950 text-sm uppercase tracking-wide">{title}</h3>
          {headerAction}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
