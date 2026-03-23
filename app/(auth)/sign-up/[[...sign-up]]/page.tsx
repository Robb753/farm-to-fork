import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

export default function SignUpPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Colonne gauche — présentation */}
          <aside className="lg:w-[420px] shrink-0 bg-white rounded-xl border border-gray-200 p-8 flex flex-col gap-6">
            <Image
              src="/logof2f.svg"
              alt="Farm To Fork"
              width={120}
              height={40}
              className="h-10 w-auto"
              priority
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Créer un compte
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                Rejoignez Farm To Fork pour découvrir des producteurs locaux,
                enregistrer vos favoris et accéder à votre espace personnel.
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="text-sm font-semibold text-gray-800 mb-1">
                Bienvenue sur Farm To Fork
              </p>
              <p className="text-sm text-gray-500 leading-relaxed">
                Découvrez des producteurs locaux, enregistrez vos fermes
                favorites et accédez à votre espace personnel simplement.
              </p>
            </div>
          </aside>

          {/* Colonne droite — composant Clerk */}
          <main className="flex-1 bg-white rounded-xl border border-gray-200 p-6 md:p-8">
            <SignUp
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
              fallbackRedirectUrl="/account"
            />
          </main>
        </div>
      </div>
    </div>
  );
}
