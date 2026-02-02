import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const pathSegments = request.nextUrl.pathname.split("/").filter(Boolean);

    if (!session && !pathSegments.includes("auth")) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    if (!pathSegments.length) {
      return NextResponse.redirect(new URL("/dashboard/main", request.url));
    }

    if (pathSegments[0] === "dashboard" && pathSegments.length === 1) {
      return NextResponse.redirect(new URL("/dashboard/main", request.url));
    }

    if (
      pathSegments[0] === "auth" &&
      (pathSegments.length === 1
        ? true
        : ["signin", "signup"].includes(pathSegments[1])) &&
      session
    ) {
      return NextResponse.redirect(new URL("/dashboard/main", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error(error);
    return NextResponse.error();
  }
}

export const config = {
  matcher: ["/dashboard/:id*", "/auth/:action"],
};
