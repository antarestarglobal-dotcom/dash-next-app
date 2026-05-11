import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

interface BrutalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const BrutalInput = forwardRef<HTMLInputElement, BrutalInputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "bg-white border-2 border-neutral-950 rounded-none px-3 py-2 text-sm text-neutral-950",
            "focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-0",
            "placeholder:text-neutral-400",
            error && "border-red-600",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-700 font-medium">{error}</p>}
      </div>
    );
  },
);
BrutalInput.displayName = "BrutalInput";
