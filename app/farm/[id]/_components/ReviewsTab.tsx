"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Star,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Calendar,
  User,
  TrendingUp,
  Award,
  Filter,
  Plus,
} from "@/utils/icons";
import { useState, useMemo, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

/**
 * Type pour un listing avec avis
 */
type ListingWithReviews = Database["public"]["Tables"]["listing"]["Row"];

/**
 * Props du composant ReviewsTab
 */
interface ReviewsTabProps {
  listing: ListingWithReviews | null;
  className?: string;
}

/**
 * Interface pour un avis (basé sur la vraie table reviews)
 */
interface Review {
  id: number;
  listing_id: number;
  user_id?: string | null;
  rating: number;
  title?: string | null;
  comment: string;
  reviewer_name?: string | null;
  reviewer_email?: string | null;
  is_verified: boolean;
  visit_type?: "delivery" | "pickup" | "visit" | "online" | null;
  purchased_products?: string[] | null;
  visit_date?: string | null;
  helpful_count: number;
  not_helpful_count: number;
  reported_count: number;
  status: "pending" | "approved" | "rejected" | "hidden";
  moderated_by?: string | null;
  moderated_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
  source: string;
}

/**
 * Interface pour les statistiques des avis
 */
interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  recentTrend: "up" | "down" | "stable";
}

/**
 * Composant d'affichage et de gestion des avis clients
 *
 * Features:
 * - Affichage des avis avec système de notation visuel
 * - Formulaire de soumission d'avis pour utilisateurs connectés
 * - Statistiques et analytics des avis
 * - Filtrage par note et type de visite
 * - Actions sociales (utile/inutile, signalement)
 * - Verification badges pour avis vérifiés
 * - Design responsive et moderne
 *
 * @param listing - Données du listing avec avis
 * @param className - Classes CSS additionnelles
 * @returns JSX.Element - Onglet des avis enrichi
 */
export default function ReviewsTab({
  listing,
  className,
}: ReviewsTabProps): JSX.Element {
  const { user } = useUser();

  // États pour le formulaire d'avis
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: "",
    name: "",
    visit_type: "visit" as Review["visit_type"],
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // États pour les filtres
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "rating" | "helpful">(
    "recent"
  );

  /**
   * Parse les avis depuis la base de données ou génère des exemples
   */
  const reviews: Review[] = useMemo(() => {
    // Pour l'instant, utilise des avis d'exemple
    // Une fois que tu auras des avis réels dans la DB, tu pourras les récupérer avec:
    // const { data: reviewsData } = await supabase
    //   .from('reviews')
    //   .select('*')
    //   .eq('listing_id', listing.id)
    //   .eq('status', 'approved')
    //   .order('created_at', { ascending: false });

    return generateSampleReviews();
  }, [listing?.id]);

  /**
   * Génère des avis d'exemple pour la démo
   */
  function generateSampleReviews(): Review[] {
    const sampleReviews: Review[] = [
      {
        id: 1,
        listing_id: listing?.id || 1,
        user_id: "user_123",
        rating: 5,
        title: null,
        comment:
          "Excellente ferme ! Produits frais et accueil chaleureux. Les enfants ont adoré voir les animaux. Je recommande vivement.",
        reviewer_name: "Marie D.",
        reviewer_email: null,
        is_verified: true,
        visit_type: "visit",
        purchased_products: ["Légumes", "Œufs"],
        visit_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        helpful_count: 12,
        not_helpful_count: 1,
        reported_count: 0,
        status: "approved",
        moderated_by: null,
        moderated_at: null,
        rejection_reason: null,
        created_at: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
        ip_address: null,
        user_agent: null,
        source: "website",
      },
      {
        id: 2,
        listing_id: listing?.id || 1,
        user_id: "user_456",
        rating: 4,
        title: null,
        comment:
          "Très bons légumes, livraison rapide. Juste un peu d'attente lors de la livraison mais ça valait le coup.",
        reviewer_name: "Pierre M.",
        reviewer_email: null,
        is_verified: true,
        visit_type: "delivery",
        purchased_products: ["Légumes"],
        visit_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        helpful_count: 8,
        not_helpful_count: 0,
        reported_count: 0,
        status: "approved",
        moderated_by: null,
        moderated_at: null,
        rejection_reason: null,
        created_at: new Date(
          Date.now() - 12 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date(
          Date.now() - 12 * 24 * 60 * 60 * 1000
        ).toISOString(),
        ip_address: null,
        user_agent: null,
        source: "website",
      },
      {
        id: 3,
        listing_id: listing?.id || 1,
        user_id: "user_789",
        rating: 5,
        title: null,
        comment:
          "Ferme familiale authentique ! Les produits bio sont délicieux et on sent la passion du producteur. Prix très raisonnables.",
        reviewer_name: "Sophie L.",
        reviewer_email: null,
        is_verified: true,
        visit_type: "pickup",
        purchased_products: ["Fruits", "Légumes"],
        visit_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        helpful_count: 15,
        not_helpful_count: 2,
        reported_count: 0,
        status: "approved",
        moderated_by: null,
        moderated_at: null,
        rejection_reason: null,
        created_at: new Date(
          Date.now() - 20 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date(
          Date.now() - 20 * 24 * 60 * 60 * 1000
        ).toISOString(),
        ip_address: null,
        user_agent: null,
        source: "website",
      },
    ];

    return sampleReviews;
  }

  /**
   * Calcule les statistiques des avis
   */
  const reviewStats: ReviewStats = useMemo(() => {
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {},
        recentTrend: "stable",
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    const ratingDistribution: Record<number, number> = {};
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = reviews.filter((r) => r.rating === i).length;
    }

    // Calculer la tendance (simplifié)
    const recentReviews = reviews.slice(0, 3);
    const oldReviews = reviews.slice(3, 6);
    const recentAvg =
      recentReviews.reduce((sum, r) => sum + r.rating, 0) /
      Math.max(recentReviews.length, 1);
    const oldAvg =
      oldReviews.reduce((sum, r) => sum + r.rating, 0) /
      Math.max(oldReviews.length, 1);

    let recentTrend: ReviewStats["recentTrend"] = "stable";
    if (recentAvg > oldAvg + 0.2) recentTrend = "up";
    else if (recentAvg < oldAvg - 0.2) recentTrend = "down";

    return {
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution,
      recentTrend,
    };
  }, [reviews]);

  /**
   * Filtre les avis selon les critères
   */
  const filteredReviews = useMemo(() => {
    let filtered = [...reviews];

    // Filtre par note
    if (filterRating !== null) {
      filtered = filtered.filter((review) => review.rating === filterRating);
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "helpful":
          return (b.helpful_count || 0) - (a.helpful_count || 0);
        case "recent":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    return filtered;
  }, [reviews, filterRating, sortBy]);

  /**
   * Soumet un nouvel avis
   */
  const handleSubmitReview = useCallback(async (): Promise<void> => {
    if (!user) {
      toast.error("Vous devez être connecté pour laisser un avis");
      return;
    }

    if (newReview.rating === 0) {
      toast.error("Veuillez attribuer une note");
      return;
    }

    if (newReview.comment.trim().length < 10) {
      toast.error("Votre commentaire doit contenir au moins 10 caractères");
      return;
    }

    setIsSubmitting(true);

    try {
      // Ici, vous intégreriez avec votre API pour sauvegarder l'avis
      // const response = await saveReview({ ...newReview, listingId: listing.id });

      // Simulation de sauvegarde
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Merci pour votre avis ! Il sera publié après modération.");

      // Reset form
      setNewReview({
        rating: 0,
        comment: "",
        name: "",
        visit_type: "visit",
      });
      setShowReviewForm(false);

      // Analytics tracking
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "submit_review", {
          event_category: "reviews_interaction",
          event_label: "new_review",
          listing_id: listing?.id,
          rating: newReview.rating,
        });
      }
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      toast.error("Erreur lors de l'envoi de votre avis");
    } finally {
      setIsSubmitting(false);
    }
  }, [user, newReview, listing?.id]);

  /**
   * Rendu des étoiles pour l'affichage
   */
  const renderStars = useCallback(
    (rating: number, size: "sm" | "md" = "sm") => {
      const starSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

      return (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={cn(
                starSize,
                i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
              )}
            />
          ))}
        </div>
      );
    },
    []
  );

  /**
   * Rendu des étoiles interactives pour le formulaire
   */
  const renderInteractiveStars = useCallback(() => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setNewReview((prev) => ({ ...prev, rating: i + 1 }))}
            className="group"
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors",
                i < newReview.rating
                  ? "text-yellow-400 fill-current"
                  : "text-gray-300 group-hover:text-yellow-200"
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {newReview.rating > 0
            ? `${newReview.rating}/5`
            : "Cliquez pour noter"}
        </span>
      </div>
    );
  }, [newReview.rating]);

  /**
   * Obtient l'icône du type de visite
   */
  const getVisitTypeIcon = useCallback((visitType: Review["visit_type"]) => {
    switch (visitType) {
      case "delivery":
        return "🚚";
      case "pickup":
        return "🏪";
      case "visit":
        return "🚶";
      case "online":
        return "💻";
      default:
        return "📝";
    }
  }, []);

  // Empty state si aucun avis
  if (reviews.length === 0 && !showReviewForm) {
    return (
      <div className={cn("text-center py-12 bg-gray-50 rounded-xl", className)}>
        <div className="bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun avis pour le moment
        </h3>
        <p className="text-gray-500 mb-6">
          Soyez le premier à partager votre expérience avec cette ferme !
        </p>

        {user ? (
          <Button
            onClick={() => setShowReviewForm(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Laisser un avis
          </Button>
        ) : (
          <p className="text-sm text-gray-400">
            Connectez-vous pour laisser un avis
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header avec statistiques */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Statistiques principales */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {reviewStats.averageRating.toFixed(1)}
              </div>
              <div className="flex items-center justify-center mt-1">
                {renderStars(Math.round(reviewStats.averageRating), "md")}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {reviewStats.totalReviews} avis
              </div>
            </div>

            {/* Distribution des notes */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2 text-sm">
                  <span className="w-3 text-gray-600">{rating}</span>
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: `${(reviewStats.ratingDistribution[rating] / reviewStats.totalReviews) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-gray-500 text-xs">
                    {reviewStats.ratingDistribution[rating] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Badge
              variant="outline"
              className={cn(
                "flex items-center gap-1",
                reviewStats.recentTrend === "up"
                  ? "text-green-700 border-green-200"
                  : reviewStats.recentTrend === "down"
                    ? "text-red-700 border-red-200"
                    : "text-gray-700 border-gray-200"
              )}
            >
              <TrendingUp className="h-3 w-3" />
              Tendance{" "}
              {reviewStats.recentTrend === "up"
                ? "positive"
                : reviewStats.recentTrend === "down"
                  ? "négative"
                  : "stable"}
            </Badge>

            {user && !showReviewForm && (
              <Button
                onClick={() => setShowReviewForm(true)}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Laisser un avis
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Formulaire d'avis */}
      {showReviewForm && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="text-green-800">
              Partagez votre expérience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Notation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note globale
              </label>
              {renderInteractiveStars()}
            </div>

            {/* Nom (optionnel) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom (optionnel)
              </label>
              <Input
                placeholder="Votre nom ou initiales"
                value={newReview.name}
                onChange={(e) =>
                  setNewReview((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            {/* Commentaire */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre avis
              </label>
              <Textarea
                placeholder="Partagez votre expérience avec cette ferme..."
                value={newReview.comment}
                onChange={(e) =>
                  setNewReview((prev) => ({ ...prev, comment: e.target.value }))
                }
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSubmitReview}
                disabled={isSubmitting || newReview.rating === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? "Envoi..." : "Publier l'avis"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReviewForm(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      {reviews.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm font-medium text-gray-700">Filtrer :</span>

          <Button
            variant={filterRating === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRating(null)}
          >
            <Filter className="h-3 w-3 mr-1" />
            Tous les avis
          </Button>

          {[5, 4, 3, 2, 1].map((rating) => (
            <Button
              key={rating}
              variant={filterRating === rating ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterRating(rating)}
            >
              {renderStars(rating, "sm")}
            </Button>
          ))}
        </div>
      )}

      {/* Liste des avis */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <Card
            key={review.id}
            className="border border-gray-200 hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-full w-10 h-10 flex items-center justify-center">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-medium text-gray-900">
                        {review.reviewer_name || "Utilisateur anonyme"}
                      </CardTitle>
                      {review.is_verified && (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                        >
                          <Award className="h-3 w-3 mr-1" />
                          Vérifié
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      {renderStars(review.rating)}
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(review.created_at).toLocaleDateString(
                          "fr-FR"
                        )}
                      </span>
                      <span
                        className="text-xs text-gray-500"
                        title={`Type de visite: ${review.visit_type}`}
                      >
                        {getVisitTypeIcon(review.visit_type)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {review.comment}
              </p>

              {review.purchased_products &&
                review.purchased_products.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500">
                      Produits achetés :
                    </span>
                    {review.purchased_products.map((product, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {product}
                      </Badge>
                    ))}
                  </div>
                )}

              {/* Actions sur l'avis */}
              <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600">
                  <ThumbsUp className="h-3 w-3" />
                  Utile ({review.helpful_count})
                </button>
                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-600">
                  <ThumbsDown className="h-3 w-3" />
                  Pas utile ({review.not_helpful_count})
                </button>
                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600">
                  <Flag className="h-3 w-3" />
                  Signaler
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message informatif */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <p className="text-blue-800 text-sm text-center">
          💡 <strong>Tous les avis sont modérés</strong> pour garantir leur
          authenticité. Seuls les clients ayant effectué un achat peuvent
          laisser un avis vérifié.
        </p>
      </div>
    </div>
  );
}
