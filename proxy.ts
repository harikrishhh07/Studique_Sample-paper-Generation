import { NextResponse, NextRequest } from "next/server";
import { isValidToken } from "./utils/security";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token");
  
  const userAgent = request.headers.get("user-agent") || "";
  const isSearchBot = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator/i.test(userAgent);
  if (
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/auth/logout") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") || // Allow auth endpoints
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/sw.js") ||
    pathname.startsWith("/offline.html") ||
    pathname.startsWith("/sitemap.xml") || // Allow sitemap
    pathname.startsWith("/robots.txt") || // Allow robots.txt
    pathname.startsWith("/mealmap") || // Allow mealmap public access
    pathname.startsWith("/finder") || // Allow finder public access
    pathname.startsWith("/calcgpa") || // Allow calcgpa public access
    pathname.startsWith("/about") || // Allow about public access
    pathname.includes(".") // Allow all static files (images, css, js, etc.)
  ) {
    return NextResponse.next();
  }
  
  if (isSearchBot) {
    return NextResponse.next();
  }
  
  if (!token || !isValidToken(token.value)) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};