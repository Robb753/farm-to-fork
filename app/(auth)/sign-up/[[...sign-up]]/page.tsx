import AuthShell from "@/app/_components/AuthShell";
import { SignUp } from "@clerk/nextjs";


export default function SignUpPage(): JSX.Element {
  return (
    <AuthShell
      title="Créer un compte"
      subtitle="Rejoignez Farm To Fork pour découvrir des producteurs locaux, enregistrer vos favoris et accéder à votre espace personnel."
    >
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/account"
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "w-full bg-transparent shadow-none border-0 p-0",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            socialButtonsBlockButton:
              "rounded-xl border border-gray-200 hover:bg-gray-50 transition shadow-none",
            socialButtonsBlockButtonText: "text-sm font-medium",
            dividerLine: "bg-gray-200",
            dividerText: "text-gray-400 text-xs",
            formFieldLabel: "text-sm font-medium text-gray-700",
            formFieldInput:
              "h-11 rounded-xl border border-gray-300 shadow-none focus:border-green-600 focus:ring-1 focus:ring-green-600",
            formButtonPrimary:
              "h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium shadow-none",
            footerActionLink: "text-green-600 hover:text-green-700",
            identityPreviewText: "text-sm",
            formResendCodeLink: "text-green-600 hover:text-green-700",
            otpCodeFieldInput:
              "h-11 rounded-xl border border-gray-300 shadow-none focus:border-green-600 focus:ring-1 focus:ring-green-600",
            alertText: "text-sm",
            formFieldSuccessText: "text-sm text-green-600",
            formFieldErrorText: "text-sm text-red-600",
            footer: "pt-4",
          },
        }}
      />
    </AuthShell>
  );
}
