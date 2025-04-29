"use client";

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Mentions légales</h1>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            1. Présentation du site
          </h2>
          <p>
            Conformément aux dispositions de la loi n°2004-575 du 21 juin 2004
            pour la Confiance en l’Économie Numérique, il est porté à la
            connaissance des utilisateurs du site <strong>farmtofork.fr</strong>{" "}
            (ci-après « le Site ») les présentes mentions légales.
          </p>
          <p className="mt-4">
            La connexion et la navigation sur le Site par l’Utilisateur
            impliquent l’acceptation intégrale et sans réserve des présentes
            mentions légales.
          </p>
          <p className="mt-4">
            Ces dernières sont accessibles à tout moment sur le Site à la
            rubrique « Mentions légales ».
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Éditeur du site</h2>
          <p>
            L'édition et la direction de la publication du Site sont assurées
            par Monsieur <strong>Robin Schmitt</strong>, domicilié au 12 rue des
            Roses, 67500 Haguenau, France.
          </p>
          <p className="mt-4">
            <br />
            Adresse e-mail :{" "}
            <a
              href="mailto:info@farmtofork.fr"
              className="underline text-green-700"
            >
              info@farmtofork.fr
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Hébergeur</h2>
          <p>
            L'hébergeur du Site est la société <strong>Vercel</strong>, dont le
            siège social est situé au 340 S Lemon Ave #4133, Walnut, CA 91789,
            USA.
            <br />
            Site internet :{" "}
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-green-700"
            >
              https://vercel.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Accès au site</h2>
          <p>
            Le Site est normalement accessible à tout moment aux utilisateurs.
            Toutefois, l’Éditeur peut décider d'une interruption pour
            maintenance technique ou mise à jour. L’Éditeur ne saurait être tenu
            responsable de toute indisponibilité du Site.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            5. Collecte des données
          </h2>
          <p>
            Le Site assure à l’Utilisateur une collecte et un traitement des
            données personnelles dans le respect de la vie privée conformément à
            la loi « Informatique et Libertés » n°78-17 du 6 janvier 1978 et au
            Règlement (UE) 2016/679 du Parlement européen (RGPD).
          </p>
          <p className="mt-4">
            L’Utilisateur dispose d'un droit d'accès, de rectification, de
            suppression et d'opposition de ses données personnelles.
          </p>
          <p className="mt-4">
            Ce droit peut être exercé par mail à :{" "}
            <a
              href="mailto:info@farmtofork.fr"
              className="underline text-green-700"
            >
              info@farmtofork.fr
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            6. Propriété intellectuelle
          </h2>
          <p>
            Toute utilisation, reproduction, diffusion, commercialisation,
            modification de toute ou partie du Site, sans autorisation expresse
            de l’Éditeur, est interdite et pourra entraîner des actions et
            poursuites judiciaires.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            7. Protection des données personnelles et cookies
          </h2>
          <p>
            Pour plus d'informations en matière de protection des données
            personnelles, veuillez consulter notre{" "}
            <a
              href="/legal/privacy-policy"
              className="underline text-green-700"
            >
              Politique de Confidentialité
            </a>
            .
          </p>
          <p className="mt-4">
            Pour plus d'informations sur les cookies, veuillez consulter notre{" "}
            <a
              href="/legal/cookies-policy"
              className="underline text-green-700"
            >
              Politique de Cookies
            </a>
            .
          </p>
          <p className="text-sm text-gray-500 mt-8">
            Dernière mise à jour : [29/04/2025]
          </p>
        </section>
      </div>
    </div>
  );
}
