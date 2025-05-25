"use client";

import Link from "next/link";

export default function BecomeFarmerPage() {
  return (
    <div className="bg-white text-gray-800">
      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-green-700 mb-4">
          Gagnez en visibilité avec Farm To Fork
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Publiez votre ferme, présentez vos produits et connectez-vous avec des
          consommateurs locaux.
        </p>
        <Link
          href="/signup-farmer"
          className="inline-block bg-green-600 hover:bg-green-700 text-white text-lg px-6 py-3 rounded-md font-semibold transition"
        >
          Démarrer maintenant
        </Link>
      </section>

      {/* ETAPES SIMPLIFIÉES */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold mb-8">
            Publier votre ferme, c’est simple
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div>
              <h3 className="font-bold text-lg mb-2">1. Créez votre fiche</h3>
              <p className="text-gray-600">
                Ajoutez le nom, l’adresse et une description de votre ferme.
                Vous pouvez la publier plus tard.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">
                2. Mettez vos produits en avant
              </h3>
              <p className="text-gray-600">
                Indiquez les types de produits disponibles (légumes, œufs,
                etc.).
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">
                3. Attendez la validation
              </h3>
              <p className="text-gray-600">
                Une fois validée, votre fiche apparaîtra sur la carte et sera
                accessible à tous les utilisateurs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MISE EN VALEUR */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-semibold text-green-700 mb-4">
          Rejoignez un réseau local engagé
        </h2>
        <p className="text-gray-600 text-lg mb-8">
          Farm To Fork soutient les circuits courts et la mise en valeur des
          producteurs locaux. Ensemble, rendons l’alimentation plus durable.
        </p>
        <Link
          href="/signup-farmer"
          className="inline-block bg-green-600 hover:bg-green-700 text-white text-lg px-6 py-3 rounded-md font-semibold transition"
        >
          Je crée ma fiche maintenant
        </Link>
      </section>
    </div>
  );
}
