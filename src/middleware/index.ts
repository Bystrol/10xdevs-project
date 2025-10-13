import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Auth pages that authenticated users should not access
const AUTH_PAGES = ["/login", "/register", "/reset-password", "/confirm-reset-password"];

// Public paths - Auth API endpoints & Server-Rendered Astro Pages
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/login",
  "/register",
  "/reset-password",
  "/confirm-reset-password",
  "/auth/confirm",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/auth/confirm-reset-password",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create supabase instance for this request
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Attach supabase client to locals
  locals.supabase = supabase;

  // Always get user session first before any other operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    locals.user = {
      email: user.email,
      id: user.id,
    };
  }

  if (user && AUTH_PAGES.includes(url.pathname)) {
    return redirect("/");
  }

  // Skip auth check for public paths
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  // Redirect to login for protected routes if not authenticated
  if (!user) {
    return redirect("/login");
  }

  return next();
});
