"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function signIn(form: FormData) {
  const parsed = z
    .object({ email: z.email().max(254), password: z.string().min(1).max(256) })
    .safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) redirect("/login?error=credentials");
  const client = await createClient();
  const { error } = await client.auth.signInWithPassword(parsed.data);
  if (error) redirect("/login?error=credentials");
  const access = await client.rpc("is_operator");
  if (access.error || access.data !== true) {
    await client.auth.signOut();
    redirect("/login?error=access");
  }
  redirect("/control");
}
export async function signOut() {
  const client = await createClient();
  const { error } = await client.auth.signOut();
  if (error) throw new Error("Sign out failed. Please retry.");
  redirect("/login");
}
