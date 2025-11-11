// components/ui/toaster.tsx
"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "./use-toast";

/**
 * Props pour le composant Toaster
 */
interface ToasterProps {
  /** Nombre maximum de toasts affichés simultanément */
  limit?: number;
  /** Position des toasts */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Composant Toaster qui gère l'affichage de tous les toasts actifs
 * 
 * Ce composant doit être placé une seule fois dans votre layout principal
 * pour gérer l'affichage de tous les toasts de l'application.
 * 
 * @example
 * ```tsx
 * // Dans votre layout principal (layout.tsx)
 * import { Toaster } from "@/components/ui/toaster";
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
 * 
 * // Dans n'importe quel composant
 * import { useToast } from "@/hooks/use-toast";
 * 
 * function MyComponent() {
 *   const { toast } = useToast();
 *   
 *   const handleSuccess = () => {
 *     toast({
 *       title: "Succès !",
 *       description: "L'opération a été effectuée avec succès.",
 *     });
 *   };
 * 
 *   return <button onClick={handleSuccess}>Afficher toast</button>;
 * }
 * ```
 */
export function Toaster({
  limit,
  position = "bottom-right",
  className,
}: ToasterProps = {}) {
  const { toasts } = useToast();

  // Limiter le nombre de toasts si spécifié
  const displayedToasts = limit ? toasts.slice(0, limit) : toasts;

  return (
    <ToastProvider>
      {displayedToasts.map(({ id, title, description, action, ...props }) => {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport className={className} data-position={position} />
    </ToastProvider>
  );
}

/**
 * Export du type pour utilisation externe
 */
export type { ToasterProps };