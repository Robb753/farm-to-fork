"use client";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">

      <h1 className="text-4xl font-bold mb-8 text-center">
        Politique de Confidentialité
      </h1>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold mb-4">ARTICLE 1 : PRÉAMBULE</h2>
          <p>
            La présente politique de confidentialité a pour but d’informer les
            utilisateurs du site <strong>Farm To Fork</strong> :
          </p>
          <ul className="list-disc list-inside mt-2">
            <li>
              Sur la manière dont sont collectées leurs données personnelles.
            </li>
            <li>Sur les droits dont ils disposent concernant ces données.</li>
            <li>Sur l’identité du responsable du traitement.</li>
            <li>Sur les destinataires de ces données personnelles.</li>
            <li>Sur la politique du site en matière de cookies.</li>
          </ul>
          <p className="mt-4">
            Cette politique complète les mentions légales consultables à
            l'adresse suivante :{" "}
            <a
              href="/legal/mentions-legales"
              className="underline text-green-700"
            >
              Mentions Légales
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            ARTICLE 2 : PRINCIPES RELATIFS À LA COLLECTE ET AU TRAITEMENT DES
            DONNÉES PERSONNELLES
          </h2>
          <p>
            Conformément à l'article 5 du RGPD, les données personnelles sont :
          </p>
          <ul className="list-disc list-inside mt-2">
            <li>Traitées de manière licite, loyale et transparente ;</li>
            <li>
              Collectées pour des finalités déterminées, explicites et légitimes
              ;
            </li>
            <li>Adéquates, pertinentes et limitées au strict nécessaire ;</li>
            <li>Exactes et tenues à jour ;</li>
            <li>Conservées pendant une durée limitée ;</li>
            <li>Sécurisées contre toute perte ou accès non autorisé.</li>
          </ul>
          <p className="mt-4">
            Le traitement repose sur votre consentement (article 6.1.a du RGPD).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            ARTICLE 3 : DONNÉES PERSONNELLES COLLECTÉES
          </h2>

          <h3 className="text-xl font-medium mt-6 mb-2">
            Article 3.1 : Données collectées
          </h3>
          <p>Les données collectées via le formulaire de feedback sont :</p>
          <ul className="list-disc list-inside mt-2">
            <li>Nom (facultatif)</li>
            <li>Adresse e-mail</li>
            <li>Contenu du message</li>
          </ul>
          <p className="mt-4">
            Finalité : répondre à vos messages et améliorer nos services.
          </p>

          <h3 className="text-xl font-medium mt-6 mb-2">
            Article 3.2 : Mode de collecte
          </h3>
          <p>
            Lors de la navigation sur le site, les données suivantes peuvent
            être automatiquement collectées :
          </p>
          <ul className="list-disc list-inside mt-2">
            <li>Adresse IP</li>
            <li>Type de navigateur, système d'exploitation</li>
            <li>Pages visitées</li>
          </ul>

          <h3 className="text-xl font-medium mt-6 mb-2">
            Article 3.3 : Hébergement des données
          </h3>
          <p>
            Le site est hébergé par <strong>Vercel Inc.</strong> (RGPD
            compliant) et les données de formulaire sont hébergées par{" "}
            <strong>Formspark</strong> (serveurs situés en Europe).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            ARTICLE 4 : RESPONSABLE DU TRAITEMENT
          </h2>
          <p>
            Les données personnelles sont collectées par :{" "}
            <strong>Farm To Fork</strong> (projet individuel).
          </p>
          <p className="mt-2">
            Contact responsable du traitement :{" "}
            <a
              href="mailto:info@farmtofork.fr"
              className="underline text-green-700"
            >
              info@farmtofork.fr
            </a>
          </p>
          <p className="mt-2">
            Il n'y a pas de Délégué à la Protection des Données désigné
            formellement.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            ARTICLE 5 : DROITS DES UTILISATEURS
          </h2>
          <p>Vous disposez des droits suivants :</p>
          <ul className="list-disc list-inside mt-2">
            <li>Droit d'accès, de rectification et d'effacement</li>
            <li>Droit à la portabilité</li>
            <li>Droit à la limitation et à l'opposition</li>
            <li>Droit de ne pas faire l'objet d'une décision automatisée</li>
            <li>Droit de définir le sort de vos données après votre décès</li>
          </ul>
          <p className="mt-4">
            Pour exercer vos droits :{" "}
            <a
              href="mailto:info@farmtofork.fr"
              className="underline text-green-700"
            >
              info@farmtofork.fr
            </a>
          </p>
          <p className="mt-2">
            En cas de difficulté, vous pouvez saisir la CNIL :{" "}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              className="underline text-green-700"
            >
              www.cnil.fr
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">ARTICLE 6 : COOKIES</h2>
          <p>
            Farm To Fork utilise uniquement des cookies essentiels au
            fonctionnement du site et de mesure d’audience anonymisée. Aucun
            cookie publicitaire n’est utilisé.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            ARTICLE 7 : MODIFICATIONS DE LA POLITIQUE
          </h2>
          <p>
            Farm To Fork se réserve le droit de modifier cette politique pour
            rester conforme à la réglementation en vigueur. Nous vous invitons à
            consulter régulièrement cette page.
          </p>
        </section>

        <p className="text-sm text-gray-500 mt-8">
          Dernière mise à jour : [29/04/2025]
        </p>
      </div>
    </div>
  );
}
