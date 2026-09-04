import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * First-run bootstrap: a brand-new user's profile has no org (nobody can assign one yet — that's
 * exactly the chicken-and-egg an admin-managed system has at signup). The first time such a user
 * tries to create a portfolio, they become the admin of a freshly created organization. Every
 * subsequent user is meant to be invited into that org via app/api/admin/users (real "admin
 * assigns/manages users" flow) rather than hitting this path.
 */
export async function ensureUserOrg(userId: string, orgNameHint?: string): Promise<string> {
  const admin = createSupabaseAdminClient();

  const { data: profile, error: profileFetchError } = await admin
    .from("profiles")
    .select("org_id")
    .eq("id", userId)
    .maybeSingle();
  if (profileFetchError) {
    throw new Error(`Failed to load profile: ${profileFetchError.message}`);
  }
  if (profile?.org_id) return profile.org_id;

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name: orgNameHint?.trim() || "My Organization" })
    .select("id")
    .single();
  if (orgError || !org) {
    throw new Error(`Failed to create organization: ${orgError?.message ?? "unknown error"}`);
  }

  const { error: profileUpdateError } = await admin
    .from("profiles")
    .update({ org_id: org.id, role: "admin" })
    .eq("id", userId);
  if (profileUpdateError) {
    throw new Error(`Failed to assign organization: ${profileUpdateError.message}`);
  }

  return org.id;
}
