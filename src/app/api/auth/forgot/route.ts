import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Récupération de compte : génère un lien de réinitialisation valable 30 min.
// En production avec un service email (RESEND_API_KEY), le lien part par email ;
// sinon (dev/démo) il est renvoyé directement pour être affiché à l'écran.
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email requis." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Réponse identique que le compte existe ou non (anti-énumération)
  if (!user) {
    return NextResponse.json({
      ok: true,
      message: "Si un compte existe avec cet email, un lien de réinitialisation a été créé.",
    });
  }

  if (!user.password) {
    return NextResponse.json({
      ok: true,
      message: `Ce compte utilise la connexion ${user.provider === "google" ? "Google" : "GitHub"} : aucun mot de passe à réinitialiser, utilisez le bouton dédié.`,
    });
  }

  const token = crypto.randomUUID().replace(/-/g, "");
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  if (process.env.RESEND_API_KEY) {
    try {
      const send = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Expéditeur configurable. Par défaut : le domaine de test Resend
          // (n'envoie qu'à VOTRE propre email tant qu'un domaine n'est pas
          // vérifié — parfait pour un premier test). Renseignez EMAIL_FROM avec
          // une adresse de votre domaine vérifié pour écrire à n'importe qui.
          from: process.env.EMAIL_FROM || "ViralRepo.AI <onboarding@resend.dev>",
          to: [email],
          subject: "🔑 Réinitialisez votre mot de passe ViralRepo.AI",
          html: `<p>Bonjour ${user.name},</p><p>Cliquez pour choisir un nouveau mot de passe (valable 30 min) :</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
        }),
      });
      if (send.ok) {
        return NextResponse.json({
          ok: true,
          message: "Un email de réinitialisation vient de vous être envoyé.",
        });
      }
      // Resend a refusé (souvent : domaine non vérifié → envoi limité à votre
      // propre adresse). On renvoie le lien directement plutôt qu'un faux succès.
      const err = await send.json().catch(() => ({}));
      return NextResponse.json({
        ok: true,
        message:
          "Email non envoyé (" +
          (err?.message || `HTTP ${send.status}`) +
          "). Voici le lien direct :",
        resetUrl,
      });
    } catch {
      // erreur réseau : repli sur le lien direct ci-dessous
    }
  }

  return NextResponse.json({
    ok: true,
    message: "Lien de réinitialisation créé (mode démo sans service email) :",
    resetUrl,
  });
}
