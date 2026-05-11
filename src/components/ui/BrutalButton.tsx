import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface BrutalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
}

export const BrutalButton = forwardRef<HTMLButtonElement, BrutalButtonProps>(
  ({ variant = "primary", size = "md", className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center font-semibold border-2 border-neutral-950 rounded-none transition-all cursor-pointer",
          "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
          !disabled && "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none",
          disabled && "opacity-50 cursor-not-allowed",
          size === "sm" && "px-3 py-1 text-xs",
          size === "md" && "px-4 py-2 text-sm",
          size === "lg" && "px-6 py-3 text-base",
          variant === "primary" && [
            "bg-neutral-950 text-white",
            !disabled && "shadow-[3px_3px_0px_#171717]",
          ],
          variant === "secondary" && [
            "bg-white text-neutral-950",
            !disabled && "shadow-[3px_3px_0px_#171717]",
          ],
          variant === "danger" && [
            "bg-red-100 text-red-950",
            !disabled && "shadow-[3px_3px_0px_#171717]",
          ],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
BrutalButton.displayName = "BrutalButton";
