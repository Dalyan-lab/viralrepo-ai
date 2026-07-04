import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPaystackSignature } from "@/lib/paystack";
import { grantReferralReward } from "@/lib/referral";

// Webhook Paystack : source de vérité des paiements. Active l'accès premium et
// déclenche la récompense de parrainage. Signature vérifiée (HMAC SHA512).

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-paystack-signature");
  if (!verifyPaystackSignature(raw, sig)) {
    return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  }

  const event = JSON.parse(raw);
  try {
    if (event.event === "charge.success") {
      const d = event.data;
      const userId = d.metadata?.userId;
      const plan = d.metadata?.plan ?? "createur";
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            subscriptionStatus: "active",
            planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            refereeDiscountUsed: d.metadata?.discount ? true : undefined,
            paystackAuthCode: d.authorization?.authorization_code ?? undefined,
            paystackCustomer: d.customer?.customer_code ?? undefined,
          },
        });
        await grantReferralReward(userId);
      }
    }
  } catch {
    // On répond 200 pour éviter les relances en boucle de Paystack.
  }

  return NextResponse.json({ received: true });
}
