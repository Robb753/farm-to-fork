"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SignupFarmerTunnel() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const requestAccessUrl = "/request-farmer-access";

    // Si l'utilisateur n'est pas connecté
    if (!isSignedIn) {
      const redirectAfterSignup = encodeURIComponent(requestAccessUrl);
      router.push(`/sign-up?redirect_url=${redirectAfterSignup}`);
      return;
    }

    // Si l'utilisateur est connecté
    const role = user?.publicMetadata?.role;

    if (role === "farmer") {
      router.push("/add-new-listing");
    } else {
      router.push(requestAccessUrl);
    }
  }, [isLoaded, isSignedIn, user, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
    </div>
  );
}
