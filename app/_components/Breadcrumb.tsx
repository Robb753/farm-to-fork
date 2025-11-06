"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "@/utils/icons";
import React from "react";
import { COLORS } from "@/lib/config";

export default function Breadcrumb() {
  const pathname = usePathname();

  // Découpe les segments du chemin
  const segments = pathname.split("/").filter((seg) => seg);

  // Gère le cas d'accueil uniquement
  if (segments.length === 0) {
    return null;
  }

  return (
    <nav
      className="text-sm my-4"
      style={{ color: COLORS.TEXT_SECONDARY }}
      aria-label="Breadcrumb"
    >
      <ol className="list-reset flex">
        <li>
          <Link
            href="/"
            className="flex items-center transition-colors hover:text-green-700"
            style={{
              color: COLORS.TEXT_SECONDARY,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.PRIMARY_DARK;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
            }}
          >
            <Home size={16} className="mr-1" />
            Accueil
          </Link>
        </li>

        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;
          const label = segment.charAt(0).toUpperCase() + segment.slice(1);

          return (
            <li key={href} className="flex items-center">
              <span className="mx-2" style={{ color: COLORS.TEXT_MUTED }}>
                /
              </span>
              {isLast ? (
                <span
                  className="font-medium"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {decodeURIComponent(label)}
                </span>
              ) : (
                <Link
                  href={href}
                  className="transition-colors"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = COLORS.PRIMARY_DARK;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                  }}
                >
                  {decodeURIComponent(label)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
