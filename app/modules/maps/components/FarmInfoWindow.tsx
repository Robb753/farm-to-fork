"use client";

import React from "react";
import { COLORS } from "@/lib/config";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FarmInfoWindowProps {
  /** Données de la ferme (issues des propriétés GeoJSON) */
  listing: {
    id: number;
    slug?: string;
    name: string;
    address?: string;
    image_url?: string;
    /** JSON stringified string[] (sérialisation GeoJSON) */
    product_type?: string;
    /** JSON stringified string[] (sérialisation GeoJSON) */
    certifications?: string;
    description?: string;
    availability?: string;
  };
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
  /**
   * "compact" (défaut) — avatar icône + contenu pleine largeur.
   * "card"    — thumbnail carré à gauche + contenu à droite.
   */
  variant?: "compact" | "card";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseArray(raw?: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeText(s?: string): string {
  return s?.trim() ?? "";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Avatar de fallback : feuille verte sur fond vert pâle */
function FarmAvatarFallback({ size = 40 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: size / 4,
        backgroundColor: COLORS.PRIMARY_BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.5,
        userSelect: "none",
      }}
      aria-hidden="true"
    >
      🌿
    </div>
  );
}

/** Thumbnail carré avec fallback */
function FarmThumbnail({
  imageUrl,
  name,
  size = 48,
}: {
  imageUrl?: string;
  name: string;
  size?: number;
}) {
  if (!imageUrl) return <FarmAvatarFallback size={size} />;
  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: size / 5,
        overflow: "hidden",
        backgroundColor: COLORS.PRIMARY_BG,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={`Photo de ${name}`}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        onError={(e) => {
          (e.currentTarget.parentElement as HTMLDivElement).innerHTML =
            `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:${size * 0.5}px">🌿</div>`;
        }}
      />
    </div>
  );
}

/** Badge de produit ou certification */
function Badge({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 11,
        fontWeight: 500,
        padding: "2px 8px",
        borderRadius: 99,
        backgroundColor: COLORS.PRIMARY_BG,
        color: COLORS.PRIMARY,
        border: `1px solid ${COLORS.PRIMARY}30`,
        whiteSpace: "nowrap",
        lineHeight: 1.4,
      }}
    >
      {label}
    </span>
  );
}

/** Bouton fermer discret */
function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Fermer"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        borderRadius: 6,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: COLORS.TEXT_MUTED,
        fontSize: 16,
        lineHeight: 1,
        padding: 0,
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          COLORS.BG_GRAY;
        (e.currentTarget as HTMLButtonElement).style.color = COLORS.TEXT_PRIMARY;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          "transparent";
        (e.currentTarget as HTMLButtonElement).style.color = COLORS.TEXT_MUTED;
      }}
    >
      ×
    </button>
  );
}

/** Bouton favori discret */
function FavoriteButton({
  isFavorite,
  onToggle,
}: {
  isFavorite: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={isFavorite}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        borderRadius: 6,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: isFavorite ? "#ef4444" : COLORS.TEXT_MUTED,
        fontSize: 15,
        lineHeight: 1,
        padding: 0,
        flexShrink: 0,
      }}
    >
      {isFavorite ? "♥" : "♡"}
    </button>
  );
}

/** Badge de disponibilité */
function AvailabilityBadge({ availability }: { availability?: string }) {
  const isOpen = availability?.toLowerCase() === "open";
  const isKnown = availability != null && availability !== "";
  if (!isKnown) return null;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: "1px 6px",
        borderRadius: 99,
        backgroundColor: isOpen ? `${COLORS.SUCCESS}18` : `${COLORS.ERROR}15`,
        color: isOpen ? COLORS.SUCCESS : COLORS.ERROR,
        border: `1px solid ${isOpen ? `${COLORS.SUCCESS}40` : `${COLORS.ERROR}30`}`,
        letterSpacing: "0.02em",
        textTransform: "uppercase" as const,
      }}
    >
      {isOpen ? "Ouvert" : "Fermé"}
    </span>
  );
}

// ─── Variant A : Compact ──────────────────────────────────────────────────────
/**
 * Variante compacte — avatar centré (fallback ou mini photo ronde)
 * puis contenu en blocs. Aucune image structurante.
 *
 * Layout :
 *  ┌─────────────────────────────────────┐
 *  │  [🌿] Ferme des Collines  [♡]  [✕] │
 *  │       📍 Lyon, Rhône               │
 *  │  [Bio] [Légumes] [Fruits]           │
 *  │  Vente directe · sur place          │
 *  │  ─────────────────────────────────  │
 *  │       [ Voir la fiche → ]           │
 *  └─────────────────────────────────────┘
 */
function CompactVariant({
  listing,
  badges,
  onClose,
  isFavorite,
  onToggleFavorite,
}: {
  listing: FarmInfoWindowProps["listing"];
  badges: string[];
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite?: (id: number) => void;
}) {
  const name = safeText(listing.name) || "Ferme sans nom";
  const address = safeText(listing.address);
  const description = safeText(listing.description);

  return (
    <div
      style={{
        width: 260,
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor: COLORS.BG_WHITE,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          padding: "12px 12px 8px",
        }}
      >
        {/* Avatar / mini-photo */}
        <FarmThumbnail imageUrl={listing.image_url} name={name} size={40} />

        {/* Nom + localisation */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              flexWrap: "wrap" as const,
              marginBottom: 2,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: COLORS.TEXT_PRIMARY,
                lineHeight: 1.3,
                wordBreak: "break-word" as const,
              }}
            >
              {name}
            </span>
            <AvailabilityBadge availability={listing.availability} />
          </div>

          {address && (
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: COLORS.TEXT_SECONDARY,
                lineHeight: 1.4,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <span aria-hidden="true">📍</span>
              {address}
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {onToggleFavorite && (
            <FavoriteButton
              isFavorite={isFavorite}
              onToggle={() => onToggleFavorite(listing.id)}
            />
          )}
          <CloseButton onClose={onClose} />
        </div>
      </div>

      {/* Badges produits/certifications */}
      {badges.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap" as const,
            gap: 4,
            padding: "0 12px 8px",
          }}
        >
          {badges.map((b) => (
            <Badge key={b} label={b} />
          ))}
        </div>
      )}

      {/* Description courte */}
      {description && (
        <p
          style={{
            margin: 0,
            padding: "0 12px 10px",
            fontSize: 11,
            color: COLORS.TEXT_SECONDARY,
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}
        >
          {description}
        </p>
      )}

      {/* Séparateur */}
      <div
        style={{
          height: 1,
          backgroundColor: COLORS.BORDER_LIGHT,
          margin: "0 12px",
        }}
      />

      {/* CTA */}
      <div style={{ padding: "10px 12px" }}>
        <a
          href={`/farm/${listing.slug ?? listing.id}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            padding: "7px 0",
            backgroundColor: COLORS.PRIMARY,
            color: COLORS.BG_WHITE,
            fontSize: 12,
            fontWeight: 600,
            textDecoration: "none",
            borderRadius: 8,
            transition: "background 0.15s",
            boxSizing: "border-box" as const,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
              COLORS.PRIMARY_DARK;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
              COLORS.PRIMARY;
          }}
        >
          Voir la fiche
          <span aria-hidden="true" style={{ fontSize: 13 }}>
            →
          </span>
        </a>
      </div>
    </div>
  );
}

// ─── Variant B : Card ─────────────────────────────────────────────────────────
/**
 * Variante "card" — thumbnail carré 48px à gauche, contenu à droite.
 * Plus dense, idéale si une image est souvent disponible.
 * Fallback propre vers icône si pas d'image.
 *
 * Layout :
 *  ┌─────────────────────────────────────┐
 *  │ [img] Ferme des Collines  [♡]  [✕] │
 *  │  48px  📍 Lyon, Rhône              │
 *  │        [Bio] [Légumes]             │
 *  │  ─────────────────────────────────  │
 *  │       [ Voir la fiche → ]           │
 *  └─────────────────────────────────────┘
 */
function CardVariant({
  listing,
  badges,
  onClose,
  isFavorite,
  onToggleFavorite,
}: {
  listing: FarmInfoWindowProps["listing"];
  badges: string[];
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite?: (id: number) => void;
}) {
  const name = safeText(listing.name) || "Ferme sans nom";
  const address = safeText(listing.address);

  return (
    <div
      style={{
        width: 260,
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor: COLORS.BG_WHITE,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header : thumbnail + contenu + actions */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "12px 12px 10px",
        }}
      >
        {/* Thumbnail 48px */}
        <FarmThumbnail imageUrl={listing.image_url} name={name} size={48} />

        {/* Contenu central */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginBottom: 3,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: COLORS.TEXT_PRIMARY,
                lineHeight: 1.3,
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap" as const,
              }}
            >
              {name}
            </span>
            <AvailabilityBadge availability={listing.availability} />
          </div>

          {address && (
            <p
              style={{
                margin: "0 0 6px 0",
                fontSize: 11,
                color: COLORS.TEXT_SECONDARY,
                lineHeight: 1.4,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <span aria-hidden="true">📍</span>
              {address}
            </p>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <div
              style={{ display: "flex", flexWrap: "wrap" as const, gap: 3 }}
            >
              {badges.map((b) => (
                <Badge key={b} label={b} />
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "flex-end",
            gap: 4,
          }}
        >
          <CloseButton onClose={onClose} />
          {onToggleFavorite && (
            <FavoriteButton
              isFavorite={isFavorite}
              onToggle={() => onToggleFavorite(listing.id)}
            />
          )}
        </div>
      </div>

      {/* Séparateur */}
      <div
        style={{
          height: 1,
          backgroundColor: COLORS.BORDER_LIGHT,
          margin: "0 12px",
        }}
      />

      {/* CTA */}
      <div style={{ padding: "10px 12px" }}>
        <a
          href={`/farm/${listing.slug ?? listing.id}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            padding: "7px 0",
            backgroundColor: COLORS.PRIMARY,
            color: COLORS.BG_WHITE,
            fontSize: 12,
            fontWeight: 600,
            textDecoration: "none",
            borderRadius: 8,
            transition: "background 0.15s",
            boxSizing: "border-box" as const,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
              COLORS.PRIMARY_DARK;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
              COLORS.PRIMARY;
          }}
        >
          Voir la fiche
          <span aria-hidden="true" style={{ fontSize: 13 }}>
            →
          </span>
        </a>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * InfoWindow compacte et sobre pour une ferme sur la carte Mapbox.
 *
 * - Fonctionne parfaitement avec ou sans image.
 * - Image toujours optionnelle : fallback sur avatar 🌿 si absente.
 * - Deux variantes : "compact" (défaut) et "card".
 * - Lisible en < 3 secondes, fond blanc, coins arrondis, ombre légère.
 *
 * Usage :
 * ```tsx
 * <FarmInfoWindow
 *   listing={props}
 *   onClose={() => popupRef.current?.remove()}
 *   variant="compact"
 * />
 * ```
 */
export function FarmInfoWindow({
  listing,
  onClose,
  isFavorite = false,
  onToggleFavorite,
  variant = "compact",
}: FarmInfoWindowProps) {
  const products = parseArray(listing.product_type);
  const certs = parseArray(listing.certifications);

  // Fusionner produits + certifications, limiter à 3 badges max
  const allBadges = [...products, ...certs];
  const badges = allBadges.slice(0, 3);

  if (variant === "card") {
    return (
      <CardVariant
        listing={listing}
        badges={badges}
        onClose={onClose}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
      />
    );
  }

  return (
    <CompactVariant
      listing={listing}
      badges={badges}
      onClose={onClose}
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
    />
  );
}

export default FarmInfoWindow;
