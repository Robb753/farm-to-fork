"use client";
import useDelayedSpinner from "./useDelayedSpinner";

export default function GlobalLoadingOverlay({
  active = false,
  label = "Recherche en cours...",
}) {
  const show = useDelayedSpinner(250); // évite le flash < 250ms
  const visible = active && show;

  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-start justify-center">
      <div className="mt-16 rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 shadow-xl backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
      </div>
    </div>
  );
}
