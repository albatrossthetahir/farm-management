import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "farm-management-super-secret-key-12345678"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let static assets, public routes, and next internals bypass
  const isPublicPath = 
    pathname === "/login" || 
    pathname.startsWith("/_next") || 
    pathname.startsWith("/public") ||
    pathname.includes(".");
    
  const isAuthApi = pathname.startsWith("/api/auth");

  // Let API auth endpoints pass
  if (isAuthApi) {
    return NextResponse.next();
  }

  // Get token from cookie
  const token = request.cookies.get("token")?.value;

  if (!token) {
    // If not authenticated and trying to access pages, redirect to login
    if (!isPublicPath && !pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // If accessing an API that is not public, return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const role = (payload as any).role;
      
      // If authenticated and trying to access login, redirect to dashboard
      if (pathname === "/login") {
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Role-Based Access Control (RBAC)
      // Accountant: Finance and ledger routes only
      // Manager: Operations, stock, labour (no financial config/loans except entries)
      // Staff: Operations viewing only (no edits)
      
      // Protect Finance pages & API
      if (pathname.startsWith("/finance") || pathname.startsWith("/api/finance")) {
        if (role !== "ADMIN" && role !== "ACCOUNTANT") {
          if (pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "Forbidden: Finance Access Only" }, { status: 403 });
          }
          return NextResponse.redirect(new URL("/", request.url));
        }
      }

      // Protect Labour management pages & API
      if (pathname.startsWith("/labour") || pathname.startsWith("/api/labour")) {
        if (role !== "ADMIN" && role !== "MANAGER") {
          if (pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "Forbidden: Operations Access Only" }, { status: 403 });
          }
          return NextResponse.redirect(new URL("/", request.url));
        }
      }

    } catch (error) {
      // Token is invalid or expired
      if (pathname.startsWith("/api/")) {
        const res = NextResponse.json({ error: "Unauthorized: Invalid Session" }, { status: 401 });
        res.cookies.delete("token");
        return res;
      }
      
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
