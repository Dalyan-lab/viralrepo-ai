import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { fetchOAuthUser, OAuthProvider } from "@/lib/oauth";

// Callback OAuth : échange le code, trouve ou crée le compte, ouvre la session.
export async function GET(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider as OAuthProvider;
  // Base des redirections : APP_URL en priorité (garantit https en production
  // derrière un proxy comme Vercel), sinon l'origine de la requête.
  const base = process.env.APP_URL || req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get("oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", base));
  }

  const info = await fetchOAuthUser(provider, code);
  if (!info) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", base));
  }

  // Trouve ou crée l'utilisateur — le rôle existant (ex : admin) est conservé.
  let user = await prisma.user.findUnique({ where: { email: info.email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: info.email,
        name: info.name,
        password: null,
        provider,
      },
    });
  }

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const res = NextResponse.redirect(new URL("/dashboard", base));
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  res.cookies.set("oauth_state", "", { path: "/", maxAge: 0 });
  return res;
}
