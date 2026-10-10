// Only Vercel Production is constrained; other environments keep master behavior.
function assertProductionSupabaseEnvironment(env) {
  if (env.VERCEL_ENV !== "production") return;

  const expected = "https://reukdkgdlvgdvyuwuaub.supabase.co";
  const invalid = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"]
    .filter((name) => env[name] !== expected);
  if (invalid.length) {
    // Report variable names only, never supplied values or credentials.
    throw new Error(
      `Production Supabase guard: ${invalid.join(", ")} must equal the exact Production URL; missing, staging, local and other targets are forbidden`,
    );
  }
}

module.exports = { assertProductionSupabaseEnvironment };
