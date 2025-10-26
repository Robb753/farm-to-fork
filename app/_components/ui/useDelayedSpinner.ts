// app/_components/ui/useDelayedSpinner.ts
"use client";
import { useEffect, useState } from "react";

export default function useDelayedSpinner(delay = 200) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(id);
  }, [delay]);
  return show;
}
