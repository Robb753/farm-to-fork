// components/ui/separator.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Props pour le composant Separator
 */
interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Orientation du séparateur */
  orientation?: "horizontal" | "vertical";
  /** Si le séparateur est purement décoratif */
  decorative?: boolean;
}

/**
 * Composant Separator pour diviser visuellement le contenu
 * 
 * @example
 * ```tsx
 * <Separator orientation="horizontal" />
 * <Separator orientation="vertical" className="h-4" />
 * <Separator decorative={false} aria-label="Section divider" />
 * ```
 */
const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      aria-orientation={orientation}
      aria-hidden={decorative ? "true" : undefined}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props}
    />
  )
);

Separator.displayName = "Separator";

export { Separator };
export type { SeparatorProps };