"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Shield,
  Heart,
  ShoppingBag,
  Tractor,
  ExternalLink,
  Trash2,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";
import { toast } from "sonner";
import { useUser, useClerk } from "@clerk/nextjs";
import { useSupabaseWithClerk } from "@/utils/supabase/client";

// ==================== TYPES ====================

type Section = "profile" | "security" | "favorites" | "orders" | "producer";

interface FavoriteItem {
  id: number;
  name: string;
  address: string | null;
  active: boolean | null;
  clerk_user_id: string | null;
  osm_id: string | null;
}

interface OrderItem {
  id: number;
  farm_id: number;
  total_price: number;
  status: string;
  created_at: string;
  farm_name?: string;
}

// ==================== NAV CONFIG ====================

const NAV_ITEMS: {
  key: Section;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  farmerOnly?: boolean;
}[] = [
  { key: "profile", label: "Profil", icon: User },
  { key: "security", label: "Sécurité", icon: Shield },
  { key: "favorites", label: "Mes favoris", icon: Heart },
  { key: "orders", label: "Mes commandes", icon: ShoppingBag },
  {
    key: "producer",
    label: "Mon espace producteur",
    icon: Tractor,
    farmerOnly: true,
  },
];

// ==================== PAGE ====================

export default function AccountPage(): JSX.Element {
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  const { openUserProfile } = useClerk();
  const supabase = useSupabaseWithClerk();

  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const role = user?.publicMetadata?.role as string | undefined;
  const isFarmer = role === "farmer" || role === "admin";

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // ==================== DATA FETCHING ====================

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingFavorites(true);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("favorites")
        .eq("user_id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      const favoriteIds: number[] = (profile as any)?.favorites ?? [];

      if (favoriteIds.length === 0) {
        setFavorites([]);
        return;
      }

      const { data: farms, error: farmsError } = await supabase
        .from("listing")
        .select("id, name, address, active, clerk_user_id, osm_id")
        .in("id", favoriteIds);

      if (farmsError) throw farmsError;

      setFavorites((farms as any) ?? []);
    } catch (error) {
      console.error("Erreur chargement favoris:", error);
      toast.error("Impossible de charger vos favoris");
    } finally {
      setLoadingFavorites(false);
    }
  }, [supabase, user]);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingOrders(true);

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, farm_id, total_price, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const rawOrders = (ordersData as any[]) ?? [];

      if (rawOrders.length === 0) {
        setOrders([]);
        return;
      }

      const farmIds = Array.from(new Set(rawOrders.map((o) => Number(o.farm_id))));
      const { data: farmsData } = await supabase
        .from("listing")
        .select("id, name")
        .in("id", farmIds);

      const farmsMap = new Map((farmsData as any[] ?? []).map((f: any) => [f.id, f.name]));

      setOrders(
        rawOrders.map((o: any) => ({
          id: o.id,
          farm_id: o.farm_id,
          total_price: o.total_price ?? 0,
          status: o.status,
          created_at: o.created_at,
          farm_name: farmsMap.get(o.farm_id),
        }))
      );
    } catch (error) {
      console.error("Erreur chargement commandes:", error);
      toast.error("Impossible de charger vos commandes");
    } finally {
      setLoadingOrders(false);
    }
  }, [supabase, user]);

  // Lazy load sections on first visit
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    if (activeSection === "favorites") loadFavorites();
    if (activeSection === "orders") loadOrders();
  }, [activeSection, isLoaded, isSignedIn, user, loadFavorites, loadOrders]);

  const removeFavorite = async (farmId: number) => {
    if (!user) return;
    try {
      const newFavorites = favorites
        .filter((f) => f.id !== farmId)
        .map((f) => f.id);

      const { error } = await supabase
        .from("profiles")
        .update({ favorites: newFavorites } as any)
        .eq("user_id", user.id);

      if (error) throw error;

      setFavorites((prev) => prev.filter((f) => f.id !== farmId));
      toast.success("Ferme retirée des favoris");
    } catch (error) {
      console.error("Erreur suppression favori:", error);
      toast.error("Impossible de retirer ce favori");
    }
  };

  // ==================== LOADING / AUTH STATE ====================

  if (!isLoaded) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      >
        <div
          className="w-10 h-10 border-4 rounded-full animate-spin"
          style={{
            borderColor: `${COLORS.PRIMARY} ${COLORS.PRIMARY} ${COLORS.PRIMARY} transparent`,
          }}
        />
      </div>
    );
  }

  if (!isSignedIn || !user) return <></>;

  const visibleNav = NAV_ITEMS.filter((item) => !item.farmerOnly || isFarmer);

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.BG_GRAY }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Page title */}
        <h1
          className="text-2xl font-bold mb-6"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          Mon compte
        </h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* ==================== SIDEBAR ==================== */}
          <aside className="md:w-64 shrink-0">
            {/* Mobile: horizontal tabs */}
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
              {visibleNav.map(({ key, label, icon: Icon }) => {
                const isActive = activeSection === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveSection(key)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                      "md:w-full md:rounded-none md:rounded-r-lg",
                      isActive
                        ? "bg-green-50 text-green-700 border-l-2 border-green-600"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ==================== CONTENT ==================== */}
          <main
            className="flex-1 rounded-xl p-6 border"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              borderColor: COLORS.BORDER,
            }}
          >
            {activeSection === "profile" && (
              <ProfileSection user={user} onEdit={() => openUserProfile()} />
            )}
            {activeSection === "security" && (
              <SecuritySection user={user} onEdit={() => openUserProfile()} />
            )}
            {activeSection === "favorites" && (
              <FavoritesSection
                favorites={favorites}
                loading={loadingFavorites}
                onRemove={removeFavorite}
              />
            )}
            {activeSection === "orders" && (
              <OrdersSection orders={orders} loading={loadingOrders} />
            )}
            {activeSection === "producer" && isFarmer && <ProducerSection />}
          </main>
        </div>
      </div>
    </div>
  );
}

// ==================== PROFILE SECTION ====================

function ProfileSection({
  user,
  onEdit,
}: {
  user: NonNullable<ReturnType<typeof useUser>["user"]>;
  onEdit: () => void;
}): JSX.Element {
  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.TEXT_PRIMARY }}>
        Profil
      </h2>

      <div className="flex items-center gap-5 mb-8">
        {user.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={fullName}
            className="w-20 h-20 rounded-full object-cover border-2"
            style={{ borderColor: COLORS.BORDER }}
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ backgroundColor: COLORS.PRIMARY }}
          >
            {fullName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-xl font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
            {fullName}
          </p>
          <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
            {email}
          </p>
        </div>
      </div>

      <div
        className="rounded-lg p-4 mb-6 space-y-4"
        style={{ backgroundColor: COLORS.BG_GRAY, borderColor: COLORS.BORDER }}
      >
        <InfoRow label="Prénom" value={user.firstName ?? "—"} />
        <InfoRow label="Nom" value={user.lastName ?? "—"} />
        <InfoRow label="Email" value={email} />
      </div>

      <button
        onClick={onEdit}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-opacity hover:opacity-90"
        style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.TEXT_WHITE }}
      >
        <ExternalLink className="w-4 h-4" />
        Modifier le profil
      </button>
    </div>
  );
}

// ==================== SECURITY SECTION ====================

function SecuritySection({
  user,
  onEdit,
}: {
  user: NonNullable<ReturnType<typeof useUser>["user"]>;
  onEdit: () => void;
}): JSX.Element {
  const email = user.emailAddresses[0]?.emailAddress ?? "";

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.TEXT_PRIMARY }}>
        Sécurité
      </h2>

      <div
        className="rounded-lg p-4 mb-6 space-y-4"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      >
        <InfoRow label="Email" value={email} />
        <InfoRow label="Mot de passe" value="••••••••••" />
      </div>

      <button
        onClick={onEdit}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-opacity hover:opacity-90 mb-4"
        style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.TEXT_WHITE }}
      >
        <Shield className="w-4 h-4" />
        Changer le mot de passe
      </button>

      <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
        La sécurité de votre compte est gérée par Clerk. Vos données sont
        protégées selon les standards de sécurité les plus élevés.
      </p>
    </div>
  );
}

// ==================== FAVORITES SECTION ====================

function FavoritesSection({
  favorites,
  loading,
  onRemove,
}: {
  favorites: FavoriteItem[];
  loading: boolean;
  onRemove: (id: number) => void;
}): JSX.Element {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.TEXT_PRIMARY }}>
        Mes favoris
      </h2>

      {loading ? (
        <SectionLoader label="Chargement de vos favoris..." />
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Aucune ferme favorite"
          description="Vous n'avez pas encore de fermes favorites"
          linkHref="/explore"
          linkLabel="Explorer les fermes"
        />
      ) : (
        <div className="space-y-4">
          {favorites.map((farm) => {
            const isUnclaimedOsm = !!farm.osm_id && !farm.clerk_user_id;
            const isInactive = !farm.active;

            return (
              <div
                key={farm.id}
                className="flex items-start justify-between gap-4 p-4 rounded-lg border"
                style={{ borderColor: COLORS.BORDER }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
                      {farm.name}
                    </p>
                    {isUnclaimedOsm && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: COLORS.ACCENT_BG,
                          color: "#92400e",
                        }}
                      >
                        Non revendiquée
                      </span>
                    )}
                    {isInactive && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: "#fee2e2",
                          color: COLORS.ERROR,
                        }}
                      >
                        Inactive
                      </span>
                    )}
                  </div>
                  {farm.address && (
                    <p className="text-sm flex items-center gap-1" style={{ color: COLORS.TEXT_SECONDARY }}>
                      <MapPin className="w-3 h-3" />
                      {farm.address}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/farm/${farm.id}`}
                    className="text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
                    style={{ borderColor: COLORS.BORDER, color: COLORS.PRIMARY }}
                  >
                    Voir la fiche
                  </Link>
                  <button
                    onClick={() => onRemove(farm.id)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                    title="Retirer des favoris"
                    style={{ color: COLORS.ERROR }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== ORDERS SECTION ====================

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "En attente", color: COLORS.WARNING, bg: "#fef3c7" },
  confirmed: { label: "Confirmée", color: COLORS.SUCCESS, bg: COLORS.SUCCESS_BG },
  ready: { label: "Prête", color: COLORS.PRIMARY, bg: COLORS.PRIMARY_BG },
  delivered: { label: "Livrée", color: COLORS.SUCCESS, bg: COLORS.SUCCESS_BG },
  cancelled: { label: "Annulée", color: COLORS.ERROR, bg: "#fee2e2" },
};

function OrdersSection({
  orders,
  loading,
}: {
  orders: OrderItem[];
  loading: boolean;
}): JSX.Element {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.TEXT_PRIMARY }}>
        Mes commandes
      </h2>

      {loading ? (
        <SectionLoader label="Chargement de vos commandes..." />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Aucune commande"
          description="Vous n'avez pas encore de commandes"
          linkHref="/explore"
          linkLabel="Explorer les fermes"
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const statusCfg = STATUS_CONFIG[order.status] ?? {
              label: order.status,
              color: COLORS.TEXT_SECONDARY,
              bg: COLORS.BG_GRAY,
            };
            const orderNumber = `FM2K-${String(order.id).padStart(6, "0")}`;
            const date = new Date(order.created_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });

            return (
              <Link
                key={order.id}
                href={`/farm/${order.farm_id}/orders/${order.id}`}
                className="flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-sm"
                style={{ borderColor: COLORS.BORDER }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: COLORS.TEXT_PRIMARY }}>
                    {orderNumber}
                  </p>
                  {order.farm_name && (
                    <p className="text-xs" style={{ color: COLORS.PRIMARY }}>
                      {order.farm_name}
                    </p>
                  )}
                  <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
                    {date}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
                  >
                    {statusCfg.label}
                  </span>
                  <p className="font-bold text-sm" style={{ color: COLORS.PRIMARY }}>
                    {order.total_price.toFixed(2)} €
                  </p>
                  <ArrowRight className="w-4 h-4" style={{ color: COLORS.TEXT_MUTED }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== PRODUCER SECTION ====================

function ProducerSection(): JSX.Element {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.TEXT_PRIMARY }}>
        Mon espace producteur
      </h2>

      <div
        className="rounded-xl p-6 border mb-6"
        style={{
          backgroundColor: COLORS.PRIMARY_BG,
          borderColor: "#bbf7d0",
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Tractor className="w-8 h-8" style={{ color: COLORS.PRIMARY }} />
          <div>
            <p className="font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
              Tableau de bord producteur
            </p>
            <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
              Gérez votre fiche ferme et vos produits
            </p>
          </div>
        </div>
      </div>

      <Link
        href="/dashboard/farms"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-opacity hover:opacity-90"
        style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.TEXT_WHITE }}
      >
        Accéder au dashboard
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// ==================== SHARED COMPONENTS ====================

function InfoRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium" style={{ color: COLORS.TEXT_SECONDARY }}>
        {label}
      </span>
      <span className="text-sm" style={{ color: COLORS.TEXT_PRIMARY }}>
        {value}
      </span>
    </div>
  );
}

function SectionLoader({ label }: { label: string }): JSX.Element {
  return (
    <div className="flex flex-col items-center py-12 gap-3">
      <div
        className="w-8 h-8 border-4 rounded-full animate-spin"
        style={{
          borderColor: `${COLORS.PRIMARY} ${COLORS.PRIMARY} ${COLORS.PRIMARY} transparent`,
        }}
      />
      <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
        {label}
      </p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  linkHref,
  linkLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  linkHref: string;
  linkLabel: string;
}): JSX.Element {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <Icon className="w-16 h-16 mb-4" style={{ color: COLORS.TEXT_MUTED }} />
      <p className="text-lg font-semibold mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
        {title}
      </p>
      <p className="text-sm mb-6" style={{ color: COLORS.TEXT_SECONDARY }}>
        {description}
      </p>
      <Link
        href={linkHref}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-opacity hover:opacity-90"
        style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.TEXT_WHITE }}
      >
        {linkLabel}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
