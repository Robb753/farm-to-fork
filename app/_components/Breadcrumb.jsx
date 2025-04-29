"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import React from "react";

export default function Breadcrumb() {
  const pathname = usePathname();

  // Découpe les segments du chemin
  const segments = pathname.split("/").filter((seg) => seg);

  // Gère le cas d'accueil uniquement
  if (segments.length === 0) {
    return null;
  }

  return (
    <nav className="text-sm text-gray-500 my-4" aria-label="Breadcrumb">
      <ol className="list-reset flex">
        <li>
          <Link
            href="/"
            className="flex items-center text-gray-600 hover:text-green-700"
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
              <span className="mx-2">/</span>
              {isLast ? (
                <span className="text-gray-800 font-medium">
                  {decodeURIComponent(label)}
                </span>
              ) : (
                <Link href={href} className="hover:text-green-700">
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
