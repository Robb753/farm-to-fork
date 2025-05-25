"use client";

import React from "react";
import { Label } from "./label";

export function Form({ className, ...props }) {
  return <form className={className} {...props} />;
}

export function FormItem({ className, ...props }) {
  return <div className={className} {...props} />;
}

export function FormLabel({ className, ...props }) {
  return <Label className={className} {...props} />;
}

export function FormControl({ className, ...props }) {
  return <div className={className} {...props} />;
}

export function FormDescription({ className, ...props }) {
  return (
    <p className={`text-sm text-muted-foreground ${className}`} {...props} />
  );
}

export function FormMessage({ className, ...props }) {
  return (
    <p className={`text-sm font-medium text-red-500 ${className}`} {...props} />
  );
}
