// Connexion sociale Google / GitHub (flux OAuth 2.0 authorization code).
// Configurez les identifiants dans .env ; sans eux, l'utilisateur est
// renvoyé vers /login avec un message explicite.

export type OAuthProvider = "google" | "github";

export function providerConfig(provider: OAuthProvider) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/oauth/${provider}/callback`;

  if (provider === "google") {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scope: "openid email profile",
      redirectUri,
    };
  }
  return {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scope: "read:user user:email",
    redirectUri,
  };
}

export async function fetchOAuthUser(
  provider: OAuthProvider,
  code: string
): Promise<{ email: string; name: string } | null> {
  const cfg = providerConfig(provider);

  const tokenRes = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: cfg.clientId!,
      client_secret: cfg.clientSecret!,
      code,
      grant_type: "authorization_code",
      redirect_uri: cfg.redirectUri,
    }),
  });
  if (!tokenRes.ok) return null;
  const { access_token } = await tokenRes.json();
  if (!access_token) return null;

  if (provider === "google") {
    const res = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    if (!res.ok) return null;
    const u = await res.json();
    if (!u.email) return null;
    return { email: u.email, name: u.name || u.email.split("@")[0] };
  }

  // GitHub
  const headers = {
    Authorization: `Bearer ${access_token}`,
    Accept: "application/vnd.github+json",
  };
  const userRes = await fetch("https://api.github.com/user", { headers });
  if (!userRes.ok) return null;
  const u = await userRes.json();

  let email: string | null = u.email;
  if (!email) {
    const emailsRes = await fetch("https://api.github.com/user/emails", { headers });
    if (emailsRes.ok) {
      const emails = await emailsRes.json();
      email =
        emails.find((e: any) => e.primary && e.verified)?.email ??
        emails.find((e: any) => e.verified)?.email ??
        null;
    }
  }
  if (!email) return null;
  return { email, name: u.name || u.login || email.split("@")[0] };
}
