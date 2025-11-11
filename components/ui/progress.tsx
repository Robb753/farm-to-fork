// components/ui/progress-simple.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Props pour le composant Progress simple
 */
interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Valeur du progrès entre 0 et 100 */
  value?: number;
}

/**
 * Composant Progress simple avec barre de progression
 * 
 * @example
 * ```tsx
 * <Progress value={75} className="w-full" />
 * <Progress value={50} />
 * ```
 */
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, className = "", ...props }, ref) => {
    // S'assurer que la valeur est entre 0 et 100
    const clampedValue = Math.min(100, Math.max(0, value || 0));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemax={100}
        aria-valuemin={0}
        className={cn(
          "relative w-full h-2 bg-muted rounded overflow-hidden",
          className
        )}
        {...props}
      >
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    );
  }
);

Progress.displayName = "Progress";

export type { ProgressProps };