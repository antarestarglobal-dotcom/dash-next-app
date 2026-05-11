import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";

type AlertVariant = "warning" | "success" | "error" | "info";

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  warning: "bg-amber-50 text-amber-950 border-amber-950",
  success: "bg-green-50 text-green-950 border-green-950",
  error: "bg-red-50 text-red-950 border-red-950",
  info: "bg-neutral-100 text-neutral-950 border-neutral-950",
};

const ICONS: Record<AlertVariant, React.ElementType> = {
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

interface BrutalAlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function BrutalAlert({ variant = "info", title, children, className }: BrutalAlertProps) {
  const Icon = ICONS[variant];
  return (
    <div
      className={cn(
        "flex gap-3 p-4 border-2 rounded-none",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="text-sm">
        {title && <p className="font-bold mb-0.5">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
