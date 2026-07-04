import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

// Confirmation après retour du Checkout : la page /billing appelle cette route
// avec le session_id pour activer le plan immédiatement — filet de sécurité qui
// fonctionne même si le webhook n'est pas configuré (utile en dev).

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ demo: true });

  const { sessionId } = await req.json();
  if (!sessionId) return NextResponse.json({ error: "sessionId manquant." }, { status: 400 });

  try {
    const cs = await stripe.checkout.sessions.retrieve(sessionId);
    // On vérifie que la session appartient bien à l'utilisateur connecté
    if (cs.client_reference_id !== session.userId) {
      return NextResponse.json({ error: "Session non autorisée." }, { status: 403 });
    }
    if (cs.payment_status === "paid" || cs.status === "complete") {
      const plan = (cs.metadata?.plan as string) ?? "createur";
      await prisma.user.update({
        where: { id: session.userId },
        data: {
          plan,
          stripeCustomerId: (cs.customer as string) ?? undefined,
          stripeSubscriptionId: (cs.subscription as string) ?? undefined,
          subscriptionStatus: "active",
        },
      });
      return NextResponse.json({ ok: true, plan });
    }
    return NextResponse.json({ ok: false, status: cs.payment_status });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Erreur Stripe.", detail: String(e?.message ?? e).slice(0, 200) },
      { status: 502 }
    );
  }
}
