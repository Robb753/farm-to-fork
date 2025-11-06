// app/_components/ui/GlobalLoadingOverlay.tsx

"use client";

import useDelayedSpinner from "./useDelayedSpinner";
import { COLORS } from "@/lib/config";

interface GlobalLoadingOverlayProps {
  active?: boolean;
  label?: string;
}

export default function GlobalLoadingOverlay({
  active = false,
  label = "Recherche en cours...",
}: GlobalLoadingOverlayProps) {
  const show = useDelayedSpinner(250); // évite le flash < 250ms
  const visible = active && show;

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-start justify-center">
      <div 
        className="mt-16 rounded-xl border px-4 py-2.5 shadow-xl backdrop-blur"
        style={{
          borderColor: COLORS.BORDER,
          backgroundColor: `${COLORS.BG_WHITE}e6`, // 90% opacity
        }}
      >
        <div className="flex items-center gap-2">
          <span 
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
            style={{
              borderColor: COLORS.PRIMARY,
              borderTopColor: 'transparent',
            }}
          />
          <span 
            className="text-sm font-medium"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}