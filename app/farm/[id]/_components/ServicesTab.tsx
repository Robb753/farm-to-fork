"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Phone,
  Euro,
  Star,
  ArrowRight,
  CheckCircle,
  Info,
  Gift,
  Truck,
  Camera,
  BookOpen,
  Utensils,
  ShoppingCart,
  Heart,
  Award,
} from "@/utils/icons";
import { useState, useMemo, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

/**
 * Type pour un listing avec services
 */
type ListingWithServices = Database["public"]["Tables"]["listing"]["Row"];

/**
 * Props du composant ServicesTab
 */
interface ServicesTabProps {
  listing: ListingWithServices | null;
  className?: string;
}

/**
 * Interface pour un service enrichi
 */
interface Service {
  id: string;
  name: string;
  description?: string;
  category:
    | "visit"
    | "workshop"
    | "delivery"
    | "tasting"
    | "accommodation"
    | "other";
  icon: React.ReactNode;
  color: string;
  price?: number;
  duration?: string;
  capacity?: number;
  availability?: string[];
  featured?: boolean;
  bookingRequired?: boolean;
  ageRestriction?: string;
  includes?: string[];
  seasons?: string[];
}

/**
 * Interface pour les catégories de services
 */
interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  services: Service[];
}

/**
 * Composant d'affichage des services d'une ferme
 *
 * Features:
 * - Affichage des services par catégories avec icônes
 * - Système de réservation pour les activités
 * - Prix et durées affichés
 * - Badges de disponibilité et saisonnalité
 * - Actions de contact et réservation
 * - Design responsive avec grid adaptatif
 * - Services mis en avant (featured)
 * - Gestion des capacités et restrictions d'âge
 *
 * @param listing - Données du listing avec services
 * @param className - Classes CSS additionnelles
 * @returns JSX.Element - Onglet des services enrichi
 */
export default function ServicesTab({
  listing,
  className,
}: ServicesTabProps): JSX.Element {
  const { user } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showBookingForm, setShowBookingForm] = useState<string | null>(null);

  /**
   * Parse et enrichit les données de services
   */
  const serviceCategories: ServiceCategory[] = useMemo(() => {
    const rawServices = listing?.additional_services;

    if (!rawServices) {
      // Générer des services par défaut basés sur le type de ferme
      return generateDefaultServices(listing);
    }

    let parsedServices: string[] = [];

    // Parse selon le format (enum additional_services_enum)
    if (typeof rawServices === "string") {
      try {
        // Si c'est du JSON
        parsedServices = JSON.parse(rawServices);
      } catch {
        // Si c'est une string simple
        parsedServices = [rawServices];
      }
    } else if (Array.isArray(rawServices)) {
      parsedServices = rawServices;
    }

    // Convertir en services enrichis
    const enrichedServices = parsedServices.map((serviceType) =>
      createServiceFromType(serviceType)
    );

    // Grouper par catégories
    return groupServicesByCategory(enrichedServices);
  }, [listing?.additional_services, listing]);

  /**
   * Génère des services par défaut selon le type de ferme
   */
  function generateDefaultServices(
    listing: ListingWithServices | null
  ): ServiceCategory[] {
    if (!listing) return [];

    const farmType = listing.typeferme?.toLowerCase() || "";
    const defaultServices: Service[] = [];

    // Services selon le type de ferme
    if (farmType.includes("maraîch") || farmType.includes("légume")) {
      defaultServices.push(
        {
          id: "farm-visit",
          name: "Visite de l'exploitation",
          description:
            "Découvrez nos techniques de culture et nos légumes de saison",
          category: "visit",
          icon: <MapPin className="h-4 w-4" />,
          color: "green",
          price: 5,
          duration: "1h30",
          capacity: 20,
          featured: true,
          bookingRequired: true,
          includes: [
            "Visite guidée",
            "Dégustation",
            "Explication des techniques",
          ],
        },
        {
          id: "basket-delivery",
          name: "Livraison de paniers",
          description: "Paniers de légumes frais livrés à domicile",
          category: "delivery",
          icon: <Truck className="h-4 w-4" />,
          color: "blue",
          price: 25,
          availability: ["Mardi", "Jeudi", "Samedi"],
          includes: ["Légumes de saison", "Recettes", "Conservation"],
        }
      );
    }

    if (farmType.includes("élevage") || farmType.includes("laitier")) {
      defaultServices.push({
        id: "dairy-workshop",
        name: "Atelier fabrication fromage",
        description: "Apprenez à fabriquer votre propre fromage",
        category: "workshop",
        icon: <BookOpen className="h-4 w-4" />,
        color: "orange",
        price: 35,
        duration: "3h",
        capacity: 12,
        featured: true,
        bookingRequired: true,
        ageRestriction: "8 ans minimum",
        includes: ["Matériel", "Ingrédients", "Fromage à emporter", "Recettes"],
      });
    }

    if (farmType.includes("fruit") || farmType.includes("arboricult")) {
      defaultServices.push(
        {
          id: "picking-activity",
          name: "Cueillette libre",
          description: "Cueillez vos fruits directement sur l'arbre",
          category: "visit",
          icon: <Gift className="h-4 w-4" />,
          color: "red",
          price: 8,
          duration: "2h",
          seasons: ["Printemps", "Été", "Automne"],
          includes: ["Panier de cueillette", "Pesée", "Conseils"],
        },
        {
          id: "jam-tasting",
          name: "Dégustation de confitures",
          description: "Découvrez nos confitures artisanales",
          category: "tasting",
          icon: <Utensils className="h-4 w-4" />,
          color: "purple",
          price: 12,
          duration: "45min",
          capacity: 15,
          includes: ["6 confitures", "Pain artisanal", "Café/Thé"],
        }
      );
    }

    return groupServicesByCategory(defaultServices);
  }

  /**
   * Crée un service enrichi à partir d'un type
   */
  function createServiceFromType(serviceType: string): Service {
    const serviceMap: Record<string, Partial<Service>> = {
      farm_visits: {
        name: "Visites de ferme",
        description: "Découvrez notre exploitation agricole",
        category: "visit",
        icon: <MapPin className="h-4 w-4" />,
        color: "green",
        price: 8,
        duration: "1h30",
      },
      workshops: {
        name: "Ateliers pratiques",
        description: "Apprenez les techniques agricoles",
        category: "workshop",
        icon: <BookOpen className="h-4 w-4" />,
        color: "orange",
        price: 25,
        duration: "2h",
      },
      tasting: {
        name: "Dégustations",
        description: "Goûtez nos produits de la ferme",
        category: "tasting",
        icon: <Utensils className="h-4 w-4" />,
        color: "purple",
        price: 15,
        duration: "1h",
      },
      delivery: {
        name: "Service de livraison",
        description: "Livraison à domicile de nos produits",
        category: "delivery",
        icon: <Truck className="h-4 w-4" />,
        color: "blue",
        price: 5,
      },
    };

    const baseService = serviceMap[serviceType] || {
      name: serviceType,
      description: `Service ${serviceType}`,
      category: "other" as const,
      icon: <Star className="h-4 w-4" />,
      color: "gray",
    };

    return {
      id: serviceType,
      bookingRequired: baseService.category !== "delivery",
      featured: false,
      capacity: 15,
      includes: ["Service inclus"],
      ...baseService,
    } as Service;
  }

  /**
   * Groupe les services par catégories
   */
  function groupServicesByCategory(services: Service[]): ServiceCategory[] {
    const categoryMap: Record<string, ServiceCategory> = {};

    services.forEach((service) => {
      const categoryId = service.category;

      if (!categoryMap[categoryId]) {
        categoryMap[categoryId] = {
          id: categoryId,
          name: getCategoryName(categoryId),
          description: getCategoryDescription(categoryId),
          icon: getCategoryIcon(categoryId),
          color: getCategoryColor(categoryId),
          services: [],
        };
      }

      categoryMap[categoryId].services.push(service);
    });

    return Object.values(categoryMap);
  }

  /**
   * Obtient le nom de la catégorie
   */
  function getCategoryName(categoryId: string): string {
    const names = {
      visit: "Visites & Découvertes",
      workshop: "Ateliers & Formations",
      delivery: "Livraison & Services",
      tasting: "Dégustations",
      accommodation: "Hébergement",
      other: "Autres Services",
    };
    return names[categoryId as keyof typeof names] || "Services";
  }

  /**
   * Obtient la description de la catégorie
   */
  function getCategoryDescription(categoryId: string): string {
    const descriptions = {
      visit: "Explorez notre ferme et découvrez nos pratiques agricoles",
      workshop: "Participez à nos ateliers pour apprendre et créer",
      delivery: "Recevez nos produits frais directement chez vous",
      tasting: "Savourez nos produits dans un cadre authentique",
      accommodation: "Séjournez à la ferme pour une expérience complète",
      other: "Services additionnels proposés par notre exploitation",
    };
    return descriptions[categoryId as keyof typeof descriptions] || "";
  }

  /**
   * Obtient l'icône de la catégorie
   */
  function getCategoryIcon(categoryId: string): React.ReactNode {
    const icons = {
      visit: <Camera className="h-5 w-5" />,
      workshop: <BookOpen className="h-5 w-5" />,
      delivery: <Truck className="h-5 w-5" />,
      tasting: <Utensils className="h-5 w-5" />,
      accommodation: <Heart className="h-5 w-5" />,
      other: <Star className="h-5 w-5" />,
    };
    return (
      icons[categoryId as keyof typeof icons] || <Star className="h-5 w-5" />
    );
  }

  /**
   * Obtient la couleur de la catégorie
   */
  function getCategoryColor(categoryId: string): string {
    const colors = {
      visit: "green",
      workshop: "orange",
      delivery: "blue",
      tasting: "purple",
      accommodation: "pink",
      other: "gray",
    };
    return colors[categoryId as keyof typeof colors] || "gray";
  }

  /**
   * Filtre les catégories selon la sélection
   */
  const filteredCategories = useMemo(() => {
    if (selectedCategory === "all") {
      return serviceCategories;
    }
    return serviceCategories.filter((cat) => cat.id === selectedCategory);
  }, [serviceCategories, selectedCategory]);

  /**
   * Compte le nombre total de services
   */
  const totalServices = useMemo(() => {
    return serviceCategories.reduce(
      (total, category) => total + category.services.length,
      0
    );
  }, [serviceCategories]);

  /**
   * Obtient les classes de couleur pour les badges
   */
  const getColorClasses = useCallback((color: string) => {
    const colorMap: Record<string, string> = {
      green: "bg-green-100 text-green-700 border-green-200",
      blue: "bg-blue-100 text-blue-700 border-blue-200",
      orange: "bg-orange-100 text-orange-700 border-orange-200",
      purple: "bg-purple-100 text-purple-700 border-purple-200",
      red: "bg-red-100 text-red-700 border-red-200",
      pink: "bg-pink-100 text-pink-700 border-pink-200",
      gray: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return colorMap[color] || colorMap.gray;
  }, []);

  /**
   * Gère la réservation d'un service
   */
  const handleBooking = useCallback(
    (serviceId: string): void => {
      if (!user) {
        toast.error("Connectez-vous pour réserver un service");
        return;
      }

      setShowBookingForm(serviceId);

      // Analytics tracking
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "service_booking_intent", {
          event_category: "services_interaction",
          event_label: serviceId,
          listing_id: listing?.id,
        });
      }
    },
    [user, listing?.id]
  );

  /**
   * Gère le contact pour un service
   */
  const handleContact = useCallback(
    (serviceId: string): void => {
      // Ouvrir le contact ou rediriger vers WhatsApp/téléphone
      const phone = listing?.phoneNumber;
      if (phone) {
        window.open(`tel:${phone}`, "_self");
      } else {
        toast.info("Contactez la ferme pour plus d'informations");
      }

      // Analytics tracking
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "service_contact", {
          event_category: "services_interaction",
          event_label: serviceId,
          listing_id: listing?.id,
        });
      }
    },
    [listing?.phoneNumber, listing?.id]
  );

  // Empty state si aucun service
  if (serviceCategories.length === 0) {
    return (
      <div className={cn("text-center py-12 bg-gray-50 rounded-xl", className)}>
        <div className="bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Star className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Services en développement
        </h3>
        <p className="text-gray-500 mb-4">
          Cette ferme développe actuellement son offre de services.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleContact("general")}
        >
          Contactez la ferme pour plus d'informations
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header avec statistiques */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nos Services</h2>
            <p className="text-gray-600 text-sm mt-1">
              {totalServices} service{totalServices > 1 ? "s" : ""} proposé
              {totalServices > 1 ? "s" : ""}
              dans {serviceCategories.length} catégorie
              {serviceCategories.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200"
            >
              <Award className="h-3 w-3 mr-1" />
              Services locaux
            </Badge>
          </div>
        </div>
      </div>

      {/* Filtres par catégorie */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("all")}
          className="whitespace-nowrap"
        >
          Tous les services
        </Button>

        {serviceCategories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="whitespace-nowrap flex items-center gap-1"
          >
            {category.icon}
            {category.name}
          </Button>
        ))}
      </div>

      {/* Grid des catégories */}
      <div className="space-y-8">
        {filteredCategories.map((category) => (
          <div key={category.id} className="space-y-4">
            {/* Header de la catégorie */}
            <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
              <div className={cn("p-2 rounded-lg", `bg-${category.color}-100`)}>
                {category.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">
                  {category.name}
                </h3>
                <p className="text-gray-600 text-sm">{category.description}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {category.services.length} service
                {category.services.length > 1 ? "s" : ""}
              </Badge>
            </div>

            {/* Services de la catégorie */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {category.services.map((service) => (
                <Card
                  key={service.id}
                  className={cn(
                    "border border-gray-200 hover:shadow-md transition-all duration-200",
                    service.featured && "ring-2 ring-green-200 bg-green-50/30"
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className={cn(
                            "p-2 rounded-lg flex-shrink-0",
                            `bg-${service.color}-100`
                          )}
                        >
                          {service.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                            {service.name}
                            {service.featured && (
                              <Badge
                                variant="outline"
                                className="ml-2 bg-yellow-100 text-yellow-700 border-yellow-200 text-xs"
                              >
                                ⭐ Recommandé
                              </Badge>
                            )}
                          </CardTitle>
                          {service.description && (
                            <p className="text-gray-600 text-sm">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Détails du service */}
                    <div className="flex flex-wrap gap-3 mt-3">
                      {service.price && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Euro className="h-3 w-3" />
                          {service.price}€
                          {service.category === "delivery"
                            ? " (frais de port)"
                            : "/pers"}
                        </div>
                      )}
                      {service.duration && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-3 w-3" />
                          {service.duration}
                        </div>
                      )}
                      {service.capacity && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Users className="h-3 w-3" />
                          Max {service.capacity} pers.
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Inclus dans le service */}
                    {service.includes && service.includes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Inclus
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {service.includes.map((item, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs bg-gray-50"
                            >
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Disponibilités */}
                    {service.availability &&
                      service.availability.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-blue-600" />
                            Disponibilités
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {service.availability.map((day, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className={getColorClasses("blue")}
                              >
                                {day}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Restrictions */}
                    {service.ageRestriction && (
                      <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                        <Info className="h-3 w-3" />
                        {service.ageRestriction}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      {service.bookingRequired ? (
                        <Button
                          onClick={() => handleBooking(service.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Réserver
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleContact(service.id)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          size="sm"
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Commander
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContact(service.id)}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Contacter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Message d'information */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <p className="text-blue-800 text-sm text-center">
          💡 <strong>Information :</strong> Les services peuvent varier selon la
          saison. Contactez directement la ferme pour confirmer la disponibilité
          et réserver.
        </p>
      </div>
    </div>
  );
}
