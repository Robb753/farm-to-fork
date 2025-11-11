// components/ui/sonner.tsx
"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

/**
 * Props pour le composant Toaster
 */
interface ToasterComponentProps extends Omit<ToasterProps, "theme"> {
  /** Theme override (optionnel, utilise next-themes par défaut) */
  theme?: ToasterProps["theme"];
}

/**
 * Composant Toaster utilisant Sonner avec intégration next-themes
 * 
 * @example
 * ```tsx
 * // Dans votre layout root
 * import { Toaster } from "@/components/ui/sonner";
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <Toaster />
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
const Toaster: React.FC<ToasterComponentProps> = ({
  theme: overrideTheme,
  ...props
}) => {
  const { theme = "system" } = useTheme();
  const resolvedTheme = overrideTheme || theme;

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
export type { ToasterComponentProps };