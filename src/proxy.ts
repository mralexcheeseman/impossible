import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  // Login renders an explicit setup state when configuration is absent/invalid.
  let configuration;
  try {
    configuration = getSupabaseConfig();
  } catch {
    if (request.nextUrl.pathname.startsWith("/control"))
      return NextResponse.redirect(new URL("/login", request.url));
    return response;
  }
  const supabase = createServerClient(
    configuration.url,
    configuration.publishableKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          const priorCookies = response.cookies.getAll();
          response = NextResponse.next({ request });
          priorCookies.forEach((cookie) => response.cookies.set(cookie));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          if (headers)
            Object.entries(headers).forEach(([name, value]) =>
              response.headers.set(name, value),
            );
        },
      },
    },
  );
  const { data, error } = await supabase.auth.getUser();
  if (
    request.nextUrl.pathname.startsWith("/control") &&
    (error || !data.user)
  ) {
    const redirected = NextResponse.redirect(new URL("/login", request.url));
    response.cookies
      .getAll()
      .forEach((cookie) => redirected.cookies.set(cookie));
    response = redirected;
  }
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}
export const config = { matcher: ["/control/:path*", "/login"] };
