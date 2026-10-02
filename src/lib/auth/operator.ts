import "server-only";
import { redirect } from "next/navigation";
import { createClient, createReadOnlyClient } from "@/lib/supabase/server";

export async function requireOperator(writable = false) {
  const client = await (writable ? createClient() : createReadOnlyClient());
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) redirect("/login");
  const access = await client.rpc("is_operator");
  if (access.error || access.data !== true) redirect("/login?error=access");
  return client;
}
