import { NextResponse, type NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/vi", req.url), 308);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/"] };
