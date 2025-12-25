"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ShoppingCart,
  Plus,
  Minus,
  SlidersHorizontal,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";
import { supabase } from "@/utils/supabase/client";
import { useCartStore, type Product } from "@/lib/store/cartStore";
import { toast } from "sonner";

/**
 * Interface pour une ferme
 */
interface Farm {
  id: number;
  name: string;
}

/**
 * Helpers boutique
 */
type FilterKey = "all" | "fruits" | "vegetables" | "other";
type SortKey = "popular" | "name" | "price_asc" | "price_desc";

function guessCategory(productName: string): FilterKey {
  const n = productName.toLowerCase();
  const fruits = [
    "pomme",
    "poire",
    "raisin",
    "fraise",
    "framboise",
    "cerise",
    "abricot",
    "pêche",
    "banane",
    "orange",
    "citron",
  ];
  const vegetables = [
    "brocoli",
    "carotte",
    "salade",
    "tomate",
    "courgette",
    "pomme de terre",
    "oignon",
    "ail",
    "poireau",
    "chou",
    "haricot",
  ];

  if (fruits.some((w) => n.includes(w))) return "fruits";
  if (vegetables.some((w) => n.includes(w))) return "vegetables";
  return "other";
}

function formatPrice(p: Product) {
  if (!p.price || p.price <= 0) return null;
  return `${p.price.toFixed(2)} € / ${p.unit || "unité"}`;
}

function productSignal(
  product: Product
): { label: string; tone: "green" | "amber" | "blue" | "gray" } | null {
  if (product.stock_status === "low_stock")
    return { label: "Stock limité", tone: "amber" };
  if (product.stock_status === "out_of_stock")
    return { label: "Indisponible", tone: "gray" };

  const d = (product.description || "").toLowerCase();
  if (
    d.includes("star") ||
    d.includes("phare") ||
    d.includes("best") ||
    d.includes("populaire")
  ) {
    return { label: "Produit phare", tone: "green" };
  }

  if (d.includes("nouveau") || d.includes("nouvelle"))
    return { label: "Nouveau", tone: "blue" };

  return null;
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "amber" | "blue" | "gray";
}) {
  const styles: Record<typeof tone, React.CSSProperties> = {
    green: {
      backgroundColor: "#EAF7EF",
      color: "#1A7F37",
      borderColor: "#BFE6CB",
    },
    amber: {
      backgroundColor: "#FFF7E6",
      color: "#9A6B00",
      borderColor: "#FFE0A3",
    },
    blue: {
      backgroundColor: "#EAF2FF",
      color: "#1E4FBF",
      borderColor: "#BFD3FF",
    },
    gray: {
      backgroundColor: "#F3F4F6",
      color: "#6B7280",
      borderColor: "#E5E7EB",
    },
  };

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
      style={styles[tone]}
    >
      {label}
    </span>
  );
}

/**
 * Page Boutique de la ferme (TUNNEL FERMÉ)
 */
export default function FarmShopPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();

  const rawId = params.id as string | undefined;
  const farmId = rawId ? Number.parseInt(rawId, 10) : Number.NaN;

  const [farm, setFarm] = useState<Farm | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI marketplace
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("popular");
  const [miniCartPulse, setMiniCartPulse] = useState(false);

  const cart = useCartStore((s) => s.cart);
  const addItem = useCartStore((s) => s.addItem);
  const canAddToCart = useCartStore((s) => s.canAddToCart);
  const getTotalItems = useCartStore((s) => s.getTotalItems);
  const getTotalPrice = useCartStore((s) => s.getTotalPrice);

  // 🔧 pulse helper
  const pulseMiniCart = useCallback(() => {
    setMiniCartPulse(true);
    window.setTimeout(() => setMiniCartPulse(false), 250);
  }, []);

  // Charger la ferme et ses produits
  useEffect(() => {
    if (!rawId || Number.isNaN(farmId)) {
      toast.error("ID de ferme invalide");
      router.push("/explore");
      return;
    }

    let cancelled = false;

    async function loadData() {
      try {
        setIsLoading(true);

        const { data: farmData, error: farmError } = await supabase
          .from("listing")
          .select("id, name")
          .eq("id", farmId)
          .eq("active", true)
          .single();

        if (farmError) throw farmError;

        if (!farmData) {
          toast.error("Ferme introuvable");
          router.push("/explore");
          return;
        }

        if (cancelled) return;
        setFarm(farmData);

        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*")
          .eq("farm_id", farmId)
          .eq("active", true)
          .order("name");

        if (productsError) throw productsError;

        const transformedProducts: Product[] = (productsData || []).map(
          (p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price ?? 0,
            unit: p.unit || "unité",
            farm_id: farmId,
            farm_name: farmData.name,
            image_url: p.image_url,
            stock_status: p.stock_status || "in_stock",
            description: p.description,
          })
        );

        if (cancelled) return;
        setProducts(transformedProducts);
      } catch (error) {
        console.error("Erreur chargement boutique:", error);
        toast.error("Erreur lors du chargement de la boutique");
        router.push("/explore");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [rawId, farmId, router]);

  // Vérifier que le panier est compatible (tunnel fermé)
  useEffect(() => {
    if (Number.isNaN(farmId)) return;

    if (cart.farmId && cart.farmId !== farmId) {
      toast.error(
        `Vous avez déjà des produits de ${cart.farmName} dans votre panier. Videz-le pour acheter chez une autre ferme.`,
        { duration: 5000 }
      );
    }
  }, [cart.farmId, cart.farmName, farmId]);

  const handleAddToCart = useCallback(
    (product: Product) => {
      if (Number.isNaN(farmId) || !canAddToCart(farmId)) {
        toast.error(
          "Vous ne pouvez acheter que chez une seule ferme à la fois"
        );
        return;
      }

      if (!product.price || product.price <= 0) {
        toast.error("Prix non défini pour ce produit (contactez la ferme).");
        return;
      }

      if (product.stock_status === "out_of_stock") {
        toast.error("Ce produit est indisponible.");
        return;
      }

      addItem(product, 1);
      toast.success(`${product.name} ajouté au panier`);
      pulseMiniCart();
    },
    [farmId, addItem, canAddToCart, pulseMiniCart]
  );

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const productCounts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: products.length,
      fruits: 0,
      vegetables: 0,
      other: 0,
    };
    products.forEach((p) => {
      const k = guessCategory(p.name);
      c[k] += 1;
    });
    return c;
  }, [products]);

  const filteredAndSorted = useMemo(() => {
    const base =
      filter === "all"
        ? products
        : products.filter((p) => guessCategory(p.name) === filter);

    const getInCartQty = (id: number) =>
      cart.items.find((i) => i.product.id === id)?.quantity || 0;

    const arr = [...base];
    arr.sort((a, b) => {
      if (sort === "popular")
        return (
          getInCartQty(b.id) - getInCartQty(a.id) ||
          a.name.localeCompare(b.name)
        );
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "price_asc")
        return (a.price || 0) - (b.price || 0) || a.name.localeCompare(b.name);
      if (sort === "price_desc")
        return (b.price || 0) - (a.price || 0) || a.name.localeCompare(b.name);
      return 0;
    });

    return arr;
  }, [products, filter, sort, cart.items]);

  if (!rawId || Number.isNaN(farmId)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      >
        <div className="text-center">
          <p style={{ color: COLORS.TEXT_SECONDARY }}>Redirection...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      >
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor: `${COLORS.PRIMARY} ${COLORS.PRIMARY} ${COLORS.PRIMARY} transparent`,
            }}
          />
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            Chargement de la boutique...
          </p>
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      >
        <div className="text-center">
          <p style={{ color: COLORS.TEXT_PRIMARY }}>Ferme non trouvée</p>
          <Link
            href="/explore"
            className="text-sm underline mt-2"
            style={{ color: COLORS.PRIMARY }}
          >
            Retour aux fermes
          </Link>
        </div>
      </div>
    );
  }

  const canAdd = canAddToCart(farmId);

  return (
    <div
      className="min-h-screen pb-32"
      style={{ backgroundColor: COLORS.BG_GRAY }}
    >
      {/* Header fixe */}
      <div
        className="sticky top-0 z-40 border-b shadow-sm"
        style={{
          backgroundColor: COLORS.BG_WHITE,
          borderColor: COLORS.BORDER,
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl">🧑‍🌾</span>
              <div className="min-w-0">
                <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                  Achat chez
                </p>
                <p
                  className="font-bold truncate"
                  style={{ color: COLORS.PRIMARY }}
                >
                  {farm.name}
                </p>
              </div>
            </div>

            <Link
              href={`/farm/${farmId}`}
              className="text-sm hover:underline"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              Voir la fiche
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div
              className="flex items-center gap-2 text-sm"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              <span>🛒</span>
              <span>
                {products.length} produit{products.length > 1 ? "s" : ""} dispo
              </span>
              <span className="opacity-50">•</span>
              <span>📦 Ajout au panier en 1 clic</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/explore"
                className="text-sm hover:underline"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                Retour aux fermes
              </Link>
            </div>
          </div>

          {/* Filtres & tri */}
          {products.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal
                  className="w-4 h-4"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                />
                <FilterPill
                  active={filter === "all"}
                  onClick={() => setFilter("all")}
                  label={`Tous (${productCounts.all})`}
                />
                <FilterPill
                  active={filter === "vegetables"}
                  onClick={() => setFilter("vegetables")}
                  label={`Légumes (${productCounts.vegetables})`}
                />
                <FilterPill
                  active={filter === "fruits"}
                  onClick={() => setFilter("fruits")}
                  label={`Fruits (${productCounts.fruits})`}
                />
                <FilterPill
                  active={filter === "other"}
                  onClick={() => setFilter("other")}
                  label={`Autres (${productCounts.other})`}
                />
              </div>

              <div className="ml-auto flex items-center gap-2">
                <ArrowUpDown
                  className="w-4 h-4"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="text-sm px-3 py-2 rounded-lg border bg-white"
                  style={{
                    borderColor: COLORS.BORDER,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                >
                  <option value="popular">Populaires</option>
                  <option value="name">Nom</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Liste produits */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1
          className="text-2xl font-bold mb-4"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          Boutique
        </h1>
        <p className="text-sm mb-6" style={{ color: COLORS.TEXT_SECONDARY }}>
          Ajoutez vos produits, puis ouvrez votre panier pour finaliser.
        </p>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Aucun produit disponible
            </h2>
            <p style={{ color: COLORS.TEXT_SECONDARY }}>
              Cette ferme n&apos;a pas encore ajouté de produits
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSorted.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                canAdd={canAdd}
                onAddToCart={handleAddToCart}
                onPulseMiniCart={pulseMiniCart}
              />
            ))}
          </div>
        )}

        {/* Fin de parcours */}
        {totalItems > 0 && (
          <div
            className="mt-8 p-4 rounded-xl border flex items-center justify-between gap-4"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              borderColor: COLORS.BORDER,
            }}
          >
            <div className="min-w-0">
              <p
                className="font-semibold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                ✅ Panier prêt ?
              </p>
              <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                Ouvrez votre panier pour choisir le mode de récupération et
                finaliser.
              </p>
            </div>
            <button
              onClick={() => router.push(`/farm/${farmId}/cart`)}
              className="px-4 py-2 rounded-lg font-semibold"
              style={{
                backgroundColor: COLORS.PRIMARY,
                color: COLORS.BG_WHITE,
              }}
            >
              Voir mon panier
            </button>
          </div>
        )}
      </div>

      {/* Mini panier sticky */}
      {totalItems > 0 && (
        <MiniCart
          itemCount={totalItems}
          totalPrice={totalPrice}
          farmId={farmId}
          pulse={miniCartPulse}
          products={products}
          cartFarmName={farm.name}
        />
      )}
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-sm px-3 py-1.5 rounded-full border transition-all",
        active ? "shadow-sm" : "hover:shadow-sm"
      )}
      style={{
        backgroundColor: active ? COLORS.PRIMARY_BG : COLORS.BG_WHITE,
        borderColor: active ? COLORS.PRIMARY : COLORS.BORDER,
        color: active ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY,
      }}
    >
      {label}
    </button>
  );
}

/**
 * Carte produit
 */
function ProductCard({
  product,
  onAddToCart,
  canAdd,
  onPulseMiniCart,
}: {
  product: Product;
  onAddToCart: (product: Product) => void;
  canAdd: boolean;
  onPulseMiniCart: () => void;
}): JSX.Element {
  const cart = useCartStore((s) => s.cart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const cartItem = cart.items.find((item) => item.product.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const signal = productSignal(product);
  const priceLabel = formatPrice(product);

  const disabledReason = !canAdd
    ? "Panier verrouillé (autre ferme)"
    : product.stock_status === "out_of_stock"
      ? "Indisponible"
      : !product.price || product.price <= 0
        ? "Prix à définir"
        : null;

  const handleIncrement = () => {
    if (disabledReason) return;

    if (quantity === 0) {
      onAddToCart(product);
      return;
    }

    updateQuantity(product.id, quantity + 1);
    onPulseMiniCart();
  };

  const handleDecrement = () => {
    if (quantity <= 0) return;

    // ✅ clamp vers 0 : autorise la suppression
    updateQuantity(product.id, Math.max(0, quantity - 1));
    onPulseMiniCart();
  };

  const stockIcon =
    product.stock_status === "in_stock"
      ? "🟢"
      : product.stock_status === "low_stock"
        ? "🟡"
        : "🔴";

  const stockText =
    product.stock_status === "in_stock"
      ? "En stock"
      : product.stock_status === "low_stock"
        ? "Stock faible"
        : "Rupture";

  return (
    <div
      className={cn(
        "p-4 rounded-xl border flex items-center justify-between gap-4",
        quantity > 0 ? "ring-1" : ""
      )}
      style={{
        backgroundColor: COLORS.BG_WHITE,
        borderColor: COLORS.BORDER,
        boxShadow:
          quantity > 0 ? "0 0 0 2px rgba(16, 185, 129, 0.12)" : undefined,
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="font-bold text-lg mb-1 truncate"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            {product.name}
          </h3>
          {signal && <Badge label={signal.label} tone={signal.tone} />}
        </div>

        {priceLabel ? (
          <p
            className="text-lg font-semibold mb-2"
            style={{ color: COLORS.PRIMARY }}
          >
            {priceLabel}
          </p>
        ) : (
          <p
            className="text-sm font-semibold mb-2"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Prix à définir
          </p>
        )}

        {product.description && (
          <p
            className="text-sm mb-2 line-clamp-2"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            {product.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-sm">
          <span>{stockIcon}</span>
          <span style={{ color: COLORS.TEXT_SECONDARY }}>{stockText}</span>
          {disabledReason && (
            <>
              <span className="opacity-40">•</span>
              <span
                className="text-xs"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                {disabledReason}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {quantity > 0 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDecrement}
              className="w-9 h-9 rounded-full flex items-center justify-center border transition-colors"
              style={{ borderColor: COLORS.PRIMARY, color: COLORS.PRIMARY }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = COLORS.PRIMARY_BG)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
              aria-label="Diminuer"
            >
              <Minus className="w-4 h-4" />
            </button>

            <span
              className="w-12 text-center font-bold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              {quantity}
            </span>

            <button
              type="button"
              onClick={handleIncrement}
              className="w-9 h-9 rounded-full flex items-center justify-center border transition-colors"
              style={{ borderColor: COLORS.PRIMARY, color: COLORS.PRIMARY }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = COLORS.PRIMARY_BG)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
              aria-label="Augmenter"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            disabled={!!disabledReason}
            className={cn(
              "px-6 py-2 rounded-lg font-medium transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            style={{
              backgroundColor: COLORS.PRIMARY,
              color: COLORS.BG_WHITE,
            }}
            onMouseEnter={(e) => {
              if (!disabledReason)
                e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
            }}
          >
            Ajouter
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Mini panier (sticky bottom)
 */
function MiniCart({
  itemCount,
  totalPrice,
  farmId,
  pulse,
  products,
  cartFarmName,
}: {
  itemCount: number;
  totalPrice: number;
  farmId: number;
  pulse: boolean;
  products: Product[];
  cartFarmName: string;
}): JSX.Element {
  const router = useRouter();
  const cart = useCartStore((s) => s.cart);

  const microMessage = useMemo(() => {
    const lowStockInCart = cart.items.some(
      (i) => i.product.stock_status === "low_stock"
    );
    if (lowStockInCart) return "⏳ Stock limité dans votre panier";

    const distinct = cart.items.length;
    if (distinct === 1)
      return "✨ Ajoutez 1–2 produits pour un panier plus complet";
    if (distinct >= 4) return "✅ Beau panier ! Vous pouvez finaliser";

    const out = products.some((p) => p.stock_status === "out_of_stock");
    if (out) return "ℹ️ Certains produits sont indisponibles";

    return `🛒 Achat chez ${cartFarmName}`;
  }, [cart.items, products, cartFarmName]);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t shadow-2xl"
      style={{
        backgroundColor: COLORS.BG_WHITE,
        borderColor: COLORS.BORDER,
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-2">
        <div className="text-xs px-1" style={{ color: COLORS.TEXT_SECONDARY }}>
          {microMessage}
        </div>

        <button
          type="button"
          onClick={() => router.push(`/farm/${farmId}/cart`)}
          className={cn(
            "w-full flex items-center justify-between px-6 py-4 rounded-xl",
            "transition-all duration-200 hover:shadow-lg",
            pulse ? "scale-[1.01]" : ""
          )}
          style={{
            backgroundColor: COLORS.PRIMARY,
            color: COLORS.BG_WHITE,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
          }}
        >
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6" />
            <span className="font-semibold">
              Panier – {itemCount} article{itemCount > 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xl font-bold">{totalPrice.toFixed(2)} €</span>
            <span className="text-sm">→</span>
          </div>
        </button>
      </div>
    </div>
  );
}
