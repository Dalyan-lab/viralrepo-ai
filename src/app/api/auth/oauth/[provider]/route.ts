import { NextRequest, NextResponse } from "next/server";
import { providerConfig, OAuthProvider } from "@/lib/oauth";

// Démarre le flux OAuth : redirige vers Google / GitHub.
export async function GET(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider as OAuthProvider;
  const base = process.env.APP_URL || req.nextUrl.origin;
  if (provider !== "google" && provider !== "github") {
    return NextResponse.redirect(new URL("/login?error=provider", base));
  }

  const cfg = providerConfig(provider);
  if (!cfg.clientId || !cfg.clientSecret) {
    return NextResponse.redirect(
      new URL(`/login?error=oauth_unconfigured&provider=${provider}`, base)
    );
  }

  const state = crypto.randomUUID();
  const url = new URL(cfg.authUrl);
  url.searchParams.set("client_id", cfg.clientId);
  url.searchParams.set("redirect_uri", cfg.redirectUri);
  url.searchParams.set("scope", cfg.scope);
  url.searchParams.set("state", state);
  if (provider === "google") {
    url.searchParams.set("response_type", "code");
    url.searchParams.set("prompt", "select_account");
  }

  const res = NextResponse.redirect(url);
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
