// components/ui/form.tsx
"use client";

import React from "react";
import { Label } from "./label";
import { cn } from "@/lib/utils";

/**
 * Types pour les composants Form
 */
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {}
interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {}
interface FormLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {}
interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {}
interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {}

/**
 * Composant Form principal
 */
export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, ...props }, ref) => {
    return <form ref={ref} className={className} {...props} />;
  }
);
Form.displayName = "Form";

/**
 * Conteneur pour un champ de formulaire
 */
export const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-2", className)}
        {...props}
      />
    );
  }
);
FormItem.displayName = "FormItem";

/**
 * Label pour un champ de formulaire
 */
export const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  FormLabelProps
>(({ className, ...props }, ref) => {
  return <Label ref={ref} className={className} {...props} />;
});
FormLabel.displayName = "FormLabel";

/**
 * Conteneur pour le contrôle de formulaire
 */
export const FormControl = React.forwardRef<HTMLDivElement, FormControlProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative", className)}
        {...props}
      />
    );
  }
);
FormControl.displayName = "FormControl";

/**
 * Description d'aide pour un champ
 */
export const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  FormDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

/**
 * Message d'erreur pour un champ
 */
export const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  FormMessageProps
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    />
  );
});
FormMessage.displayName = "FormMessage";

/**
 * Export des types pour utilisation externe
 */
export type {
  FormProps,
  FormItemProps,
  FormLabelProps,
  FormControlProps,
  FormDescriptionProps,
  FormMessageProps,
};