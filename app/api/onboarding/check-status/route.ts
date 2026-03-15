// app/api/onboarding/check-status/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import type { Database } from "@/lib/types/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RequestStatus = "none" | "pending" | "approved" | "rejected";

interface CheckStatusResponse {
  status: RequestStatus;
  adminNote?: string | null;
}

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(): Promise<NextResponse<CheckStatusResponse>> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ status: "none" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("farmer_requests")
    .select("status, admin_reason")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[CHECK-STATUS] Supabase error:", error);
    return NextResponse.json({ status: "none" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ status: "none" });
  }

  return NextResponse.json({
    status: data.status as RequestStatus,
    adminNote: data.admin_reason ?? null,
  });
}
