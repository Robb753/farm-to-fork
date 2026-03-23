import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
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
            Créer un compte
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Rejoignez la communauté Farm To Fork
          </p>
        </div>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  );
}
