"use client";

import Breadcrumb from "@/app/_components/Breadcrumb";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function FeedbackPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Breadcrumb />

      <h1 className="text-4xl font-bold text-center mb-6">Donnez votre avis</h1>
      <p className="text-center text-gray-600 mb-8">
        Une suggestion, une remarque, ou une idée ? Faites-le nous savoir !
      </p>

      <form
        action="https://submit-form.com/6Rlha6Mzr"
        method="POST"
        className="space-y-6"
      >
        {/* Redirection personnalisée après succès */}
        <input
          type="hidden"
          name="_redirect"
          value="https://www.farmtofork.fr/feedback/success"
        />

        {/* Redirection personnalisée après erreur */}
        <input
          type="hidden"
          name="_error"
          value="https://www.farmtofork.fr/feedback/error"
        />

        {/* Ne pas ajouter les données du formulaire dans l'URL */}
        <input type="hidden" name="_append" value="false" />

        {/* Honeypot anti-spam */}
        <div style={{ display: "none" }}>
          <label htmlFor="company">Ne pas remplir ce champ</label>
          <input type="text" id="company" name="company" />
        </div>

        {/* Champs normaux */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-gray-700">
            Nom
          </label>
          <Input type="text" id="name" name="name" required />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-gray-700">
            Email
          </label>
          <Input type="email" id="email" name="email" required />
        </div>

        <div className="space-y-2">
          <label htmlFor="message" className="block text-gray-700">
            Message
          </label>
          <Textarea id="message" name="message" required rows={6} />
        </div>

        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700"
        >
          Envoyer
        </Button>
        <p className="text-xs text-gray-500 mt-4 text-center">
          En soumettant ce formulaire, vous acceptez notre{" "}
          <a
            href="/legal/privacy-policy"
            className="underline hover:text-green-700"
          >
            politique de confidentialité
          </a>
          .
        </p>
      </form>
    </div>
  );
}
