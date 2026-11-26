// GET /api/google/connect → Google consent screen (owner only).
// state + PKCE verifier are kept in a short-lived httpOnly cookie.
import { NextResponse, type NextRequest } from "next/server";
import { getMember } from "@/server/auth";
import { authUrl, googleConfigured, newPkce, OAUTH_COOKIE, redirectUri } from "@/server/google";

export async function GET(req: NextRequest) {
  const ctx = await getMember();
  if (!ctx) return NextResponse.redirect(new URL("/login", req.url));
  if (ctx.role !== "owner" || !googleConfigured()) return NextResponse.redirect(new URL("/more/backup?drive=unavailable", req.url));

  const { verifier, challenge, state } = newPkce();
  const res = NextResponse.redirect(authUrl({ redirectUri: redirectUri(req.nextUrl.origin), state, challenge }));
  res.cookies.set(OAUTH_COOKIE, `${state}.${verifier}.${ctx.orgId}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // must survive the top-level redirect back from Google
    path: "/api/google",
    maxAge: 600,
  });
  return res;
}
