"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SignupFarmerTunnel() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    // Non connecté → redirige vers signup
    if (!isSignedIn) {
      router.push(`/sign-up?redirectUrl=/request-farmer-access`);
      return;
    }

    // Connecté → route selon rôle
    const role = user?.publicMetadata?.role;
    if (role === "farmer") router.push("/dashboard/farms");
    else router.push("/request-farmer-access");
  }, [isLoaded, isSignedIn, user, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-green-600" />
    </div>
  );
}
