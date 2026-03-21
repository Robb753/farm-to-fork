"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useSupabaseWithClerk } from "@/utils/supabase/client";

const CATEGORIES = [
  "Légumes",
  "Fruits",
  "Laitages",
  "Viandes",
  "Céréales",
  "Miel & Confitures",
  "Boissons",
  "Autres",
];

const UNITS = ["kg", "pièce", "litre", "botte", "douzaine"];

type SuggestionStatus = "idle" | "loading" | "success" | "error";
type SubmitStatus = "idle" | "loading" | "success" | "error";

export default function AddProductPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const supabase = useSupabaseWithClerk();

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("kg");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");

  // UI state
  const [suggestionStatus, setSuggestionStatus] = useState<SuggestionStatus>("idle");
  const [suggestionError, setSuggestionError] = useState("");
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [aiSuggested, setAiSuggested] = useState(false);

  // Profile state
  const [farmId, setFarmId] = useState<number | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      window.location.href = "/sign-in";
      return;
    }

    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("farm_id")
          .eq("user_id", user!.id)
          .single();

        if (error || !data) {
          toast.error("Profil introuvable. Veuillez contacter le support.");
          return;
        }

        if (!data.farm_id) {
          toast.error("Aucune ferme associée à votre compte.");
          return;
        }

        setFarmId(data.farm_id);
      } catch {
        toast.error("Impossible de charger votre profil.");
      } finally {
        setProfileLoading(false);
      }
    }

    fetchProfile();
  }, [isLoaded, isSignedIn, user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSuggest() {
    if (name.trim().length < 2) return;

    setSuggestionStatus("loading");
    setSuggestionError("");

    try {
      const res = await fetch("/api/suggest-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: name }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setSuggestionStatus("error");
        setSuggestionError(data.error ?? "Erreur lors de la suggestion");
        return;
      }

      setName(data.name);
      setCategory(data.category);
      setUnit(data.unit);
      setAiSuggested(true);
      setSuggestionStatus("success");
    } catch {
      setSuggestionStatus("error");
      setSuggestionError("Impossible de contacter l'IA. Vérifiez votre connexion.");
    }
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Le nom du produit est requis.");
      return;
    }
    if (!category) {
      toast.error("Veuillez sélectionner une catégorie.");
      return;
    }
    if (!unit) {
      toast.error("Veuillez sélectionner une unité.");
      return;
    }
    const parsedPrice = parseFloat(price);
    if (!price || parsedPrice <= 0) {
      toast.error("Le prix doit être supérieur à 0.");
      return;
    }
    if (!farmId) {
      toast.error("Ferme introuvable. Impossible d'ajouter le produit.");
      return;
    }

    const parsedQty = stockQuantity.trim() !== "" ? parseInt(stockQuantity, 10) : null;

    setSubmitStatus("loading");

    try {
      const { error } = await supabase.from("products").insert({
        listing_id: farmId,
        farm_id: farmId,
        name: name.trim(),
        category,
        unit,
        price: parsedPrice,
        stock_quantity: parsedQty ?? undefined,
        available: true,
        is_published: true,
        active: true,
        stock_status: "in_stock",
      });

      if (error) {
        console.error("Supabase insert error:", error);
        toast.error(`Erreur lors de l'enregistrement : ${error.message}`);
        setSubmitStatus("error");
        return;
      }

      setSubmitStatus("success");
      toast.success("Produit ajouté !");
      window.location.href = "/dashboard/farms";
    } catch {
      toast.error("Erreur inattendue. Veuillez réessayer.");
      setSubmitStatus("error");
    }
  }

  if (!isLoaded || profileLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">Chargement…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white py-10 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Ajouter un produit</h1>
          <p className="text-sm text-gray-500 mt-1">
            Renseignez les informations de votre produit.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">

          {/* 1. Nom du produit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom du produit
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSuggestionStatus("idle");
                }}
                placeholder="Ex : tomates cerises, miel de lavande…"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <button
                onClick={handleSuggest}
                disabled={name.trim().length < 2 || suggestionStatus === "loading"}
                className="shrink-0 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              >
                {suggestionStatus === "loading" ? "…" : "Suggérer"}
              </button>
            </div>

            {suggestionStatus === "success" && (
              <p className="mt-1.5 text-xs text-green-600 font-medium">
                ✓ Suggestion appliquée
              </p>
            )}
            {suggestionStatus === "error" && (
              <p className="mt-1.5 text-xs text-red-500">{suggestionError}</p>
            )}
          </div>

          {/* 2. Catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Catégorie
            </label>

            {aiSuggested && category ? (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                  {category}
                </span>
                <button
                  onClick={() => setAiSuggested(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Modifier
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      category === c
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-700"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Prix de vente + Unité (champ combiné) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Prix de vente
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="3.50"
                className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <span className="text-sm text-gray-500">€ par</span>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Stock disponible (optionnel) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Stock disponible{" "}
              <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              placeholder="Ex : 20"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitStatus === "loading"}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl px-6 py-3 text-sm font-medium transition-colors"
          >
            {submitStatus === "loading" ? "Enregistrement…" : "Ajouter le produit"}
          </button>

        </div>
      </div>
    </main>
  );
}
