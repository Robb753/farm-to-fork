import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/logof2f.svg"
            alt="Farm To Fork"
            className="h-10 mx-auto mb-4"
          />
          <h1 className="text-2xl font-semibold text-gray-900">
            Connexion
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Connectez-vous pour accéder à votre espace
          </p>
        </div>
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  );
}
