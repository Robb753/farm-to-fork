"use client";

import React, { useState } from "react";
import Breadcrumb from "@/app/_components/Breadcrumb";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { COLORS, FEEDBACK_CONFIG } from "@/lib/config/constants";

/**
 * Interface pour les données du formulaire
 */
interface FeedbackFormData {
  name: string;
  email: string;
  category: string;
  message: string;
}

/**
 * Types de feedback disponibles
 */
const FEEDBACK_CATEGORIES = [
  { value: "bug", label: "🐛 Signaler un bug", color: "text-red-600" },
  { value: "feature", label: "💡 Nouvelle fonctionnalité", color: "text-blue-600" },
  { value: "improvement", label: "🎨 Amélioration", color: "text-purple-600" },
  { value: "content", label: "📝 Contenu", color: "text-green-600" },
  { value: "other", label: "💬 Autre", color: "text-gray-600" },
] as const;

/**
 * Page de formulaire de feedback
 * 
 * Features:
 * - Formulaire structuré avec catégories
 * - Validation côté client
 * - Protection anti-spam avec honeypot
 * - Configuration centralisée des couleurs
 * - Gestion d'états de soumission
 */
export default function FeedbackPage(): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<FeedbackFormData>({
    name: "",
    email: "",
    category: "",
    message: "",
  });

  /**
   * Gestion des changements dans le formulaire
   */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Gestion de la soumission du formulaire
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const form = e.currentTarget;
      const formDataToSend = new FormData(form);
      
      const response = await fetch(FEEDBACK_CONFIG.SUBMIT_URL, {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        toast.success("Feedback envoyé avec succès !");
        // Redirection vers la page de succès
        window.location.href = "/feedback/success";
      } else {
        throw new Error("Erreur lors de l'envoi");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du feedback:", error);
      toast.error("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* ✅ Fil d'Ariane */}
      <Breadcrumb />

      {/* ✅ En-tête */}
      <div className="text-center mb-8">
        <h1 
          className="text-4xl font-bold mb-4"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          Donnez votre avis
        </h1>
        <p 
          className="text-lg"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          Une suggestion, une remarque, ou une idée ? Aidez-nous à améliorer Farm to Fork !
        </p>
      </div>

      {/* ✅ Formulaire avec gestion d'état */}
      <form
        action={FEEDBACK_CONFIG.SUBMIT_URL}
        method="POST"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* ✅ Configuration de redirection */}
        <input
          type="hidden"
          name="_redirect"
          value={`${FEEDBACK_CONFIG.BASE_URL}/feedback/success`}
        />
        <input
          type="hidden"
          name="_error"
          value={`${FEEDBACK_CONFIG.BASE_URL}/feedback/error`}
        />
        <input type="hidden" name="_append" value="false" />

        {/* ✅ Honeypot anti-spam */}
        <div style={{ display: "none" }} aria-hidden="true">
          <label htmlFor="company">Ne pas remplir ce champ</label>
          <input type="text" id="company" name="company" tabIndex={-1} />
        </div>

        {/* ✅ Champ Nom */}
        <div className="space-y-2">
          <label 
            htmlFor="name" 
            className="block font-medium"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Nom <span style={{ color: COLORS.ERROR }}>*</span>
          </label>
          <Input 
            type="text" 
            id="name" 
            name="name" 
            value={formData.name}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            className={cn(
              "focus:ring-2 focus:ring-green-500 focus:border-green-500",
              isSubmitting && "opacity-50 cursor-not-allowed"
            )}
            placeholder="Votre nom complet"
          />
        </div>

        {/* ✅ Champ Email */}
        <div className="space-y-2">
          <label 
            htmlFor="email" 
            className="block font-medium"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Email <span style={{ color: COLORS.ERROR }}>*</span>
          </label>
          <Input 
            type="email" 
            id="email" 
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            className={cn(
              "focus:ring-2 focus:ring-green-500 focus:border-green-500",
              isSubmitting && "opacity-50 cursor-not-allowed"
            )}
            placeholder="votre.email@exemple.com"
          />
        </div>

        {/* ✅ Sélection de catégorie */}
        <div className="space-y-2">
          <label 
            htmlFor="category" 
            className="block font-medium"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Type de retour <span style={{ color: COLORS.ERROR }}>*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            className={cn(
              "w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500",
              isSubmitting && "opacity-50 cursor-not-allowed"
            )}
            style={{
              borderColor: COLORS.BORDER,
              backgroundColor: COLORS.BG_WHITE,
            }}
          >
            <option value="">Sélectionnez un type</option>
            {FEEDBACK_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* ✅ Champ Message */}
        <div className="space-y-2">
          <label 
            htmlFor="message" 
            className="block font-medium"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Message <span style={{ color: COLORS.ERROR }}>*</span>
          </label>
          <Textarea 
            id="message" 
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            rows={6}
            className={cn(
              "focus:ring-2 focus:ring-green-500 focus:border-green-500",
              isSubmitting && "opacity-50 cursor-not-allowed"
            )}
            placeholder="Décrivez votre suggestion, problème ou idée en détail..."
          />
          <p 
            className="text-sm"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            Plus vous êtes précis, mieux nous pourrons vous aider.
          </p>
        </div>

        {/* ✅ Section d'information */}
        <div 
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: COLORS.PRIMARY_BG,
            borderColor: `${COLORS.PRIMARY}20`,
          }}
        >
          <h3 
            className="font-medium mb-2"
            style={{ color: COLORS.PRIMARY }}
          >
            💡 Conseils pour un bon feedback
          </h3>
          <ul 
            className="text-sm space-y-1"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            <li>• Soyez précis dans votre description</li>
            <li>• Mentionnez votre navigateur/appareil si c'est un bug</li>
            <li>• Proposez des solutions si vous en avez</li>
            <li>• Nous répondons sous 48h si nécessaire</li>
          </ul>
        </div>

        {/* ✅ Bouton de soumission */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full font-semibold py-3",
            "transition-all duration-200 hover:shadow-md",
            "focus:ring-2 focus:ring-offset-2 focus:ring-green-500",
            isSubmitting && "opacity-50 cursor-not-allowed"
          )}
          style={{
            backgroundColor: COLORS.PRIMARY,
            color: COLORS.BG_WHITE,
          }}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Envoi en cours...</span>
            </div>
          ) : (
            "Envoyer mon feedback"
          )}
        </Button>

        {/* ✅ Note de confidentialité */}
        <div 
          className="p-4 rounded-lg border text-center"
          style={{
            backgroundColor: COLORS.BG_GRAY,
            borderColor: COLORS.BORDER,
          }}
        >
          <div className="flex items-start space-x-2 text-left">
            <div className="text-lg">🔒</div>
            <div>
              <p 
                className="text-sm font-medium mb-1"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Vos données sont protégées
              </p>
              <p 
                className="text-xs"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                En soumettant ce formulaire, vous acceptez notre{" "}
                <a
                  href="/legal/privacy-policy"
                  className={cn(
                    "underline hover:no-underline transition-colors duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 rounded"
                  )}
                  style={{ color: COLORS.PRIMARY }}
                >
                  politique de confidentialité
                </a>
                . Nous ne partageons jamais vos informations.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}