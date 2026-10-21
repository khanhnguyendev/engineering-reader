import { NextResponse, type NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === "/") {
    const u = req.nextUrl.clone();
    u.pathname = "/vi";
    return NextResponse.redirect(u, 308);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/"] };
