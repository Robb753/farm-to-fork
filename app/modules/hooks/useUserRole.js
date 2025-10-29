// app/(où_tu_le_mets)/useUserRole.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/utils/supabase/client";

export default function useUserRole() {
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState(null); // "user" | "farmer" | "admin" | null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!isLoaded) return; // attend Clerk
      if (!user) {
        // déconnecté
        if (alive) {
          setRole(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const email = user.primaryEmailAddress?.emailAddress;
        if (!email) throw new Error("Aucune adresse e-mail Clerk");

        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("email", email)
          .maybeSingle();

        if (error) throw error;

        const nextRole = data?.role ?? "user";
        if (alive) setRole(nextRole);
      } catch (e) {
        if (alive) setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [isLoaded, user]);

  const flags = useMemo(
    () => ({
      isUser: role === "user",
      isFarmer: role === "farmer",
      isAdmin: role === "admin",
    }),
    [role]
  );

  return { role, ...flags, loading, error, user };
}
