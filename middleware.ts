import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/profile", "/watchlist", "/library", "/admin", "/theater"];
const AUTH_PREFIXES = ["/login", "/signup"];
const BOOKING_FLOW_PATTERN = /^\/movies\/[^/]+\/book(\/.*)?$/;

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (
    !user &&
    (matchesPrefix(pathname, PROTECTED_PREFIXES) || BOOKING_FLOW_PATTERN.test(pathname))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?redirectTo=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (user && matchesPrefix(pathname, AUTH_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/watchlist/:path*",
    "/library/:path*",
    "/admin/:path*",
    "/theater/:path*",
    "/movies/:movieId/book",
    "/movies/:movieId/book/:path*",
    "/login",
    "/signup",
    "/api/favorites/:path*",
    "/api/watchlist/:path*",
    "/api/profile/:path*",
    "/api/users/:path*",
    "/api/admin/:path*",
    "/api/bookings/:path*",
    "/api/showtimes/:path*",
  ],
};
