"use client";

export default function CookiesPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">
        Politique de Cookies
      </h1>

      <div className="space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Qu’est-ce qu’un cookie ?
          </h2>
          <p>
            Un cookie est un petit fichier texte enregistré sur votre appareil
            lors de la visite d'un site internet. Il permet de reconnaître votre
            appareil et d'améliorer votre expérience utilisateur, sans révéler
            directement votre identité.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Quels cookies utilisons-nous ?
          </h2>
          <ul className="list-disc list-inside ml-4">
            <li>
              Cookies techniques nécessaires au bon fonctionnement du site
            </li>
            <li>Cookies de mesure d’audience anonymisés</li>
            <li>Cookies soumis à votre consentement via Axeptio</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Gestion des cookies</h2>
          <p>
            Lors de votre première visite, un bandeau Axeptio vous permet de
            paramétrer votre consentement. Vous pouvez également modifier vos
            préférences à tout moment en cliquant sur l’icône Axeptio en bas à
            gauche du site.
          </p>
        </section>

        <p className="text-sm text-gray-500 mt-12">
          Dernière mise à jour : [29/04/2025]
        </p>
      </div>
    </div>
  );
}
