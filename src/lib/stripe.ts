import Stripe from "stripe";

// Client Stripe côté serveur. Renvoie null si la clé n'est pas configurée
// (mode démo — la page pricing affiche un message d'aide au lieu de facturer).
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // On laisse le SDK utiliser sa version d'API par défaut (évite un couplage
  // fragile à une chaîne de version précise).
  return new Stripe(key);
}

export type PlanId = "createur" | "studio";

// Prix créés à la volée (price_data) → pas besoin de créer des produits/prix
// dans le dashboard Stripe au préalable. Montants en centimes d'euro.
export const PLANS: Record<PlanId, { name: string; amount: number; label: string }> = {
  createur: { name: "ViralRepo.AI — Créateur", amount: 1900, label: "19€ / mois" },
  studio: { name: "ViralRepo.AI — Studio", amount: 4900, label: "49€ / mois" },
};

export const PLAN_LABELS: Record<string, string> = {
  decouverte: "Découverte (gratuit)",
  createur: "Créateur",
  studio: "Studio",
};

// Coupons de parrainage (créés une fois, réutilisés). Réduction appliquée
// au 1er paiement uniquement (duration: once).
export const COUPON_FILLEUL = "REFERRAL_FILLEUL"; // -20% bienvenue filleul
export const COUPON_PARRAIN = "REFERRAL_PARRAIN"; // -100% (1 mois offert) parrain

export async function ensureCoupon(
  stripe: Stripe,
  id: string,
  percentOff: number,
  name: string
) {
  try {
    return await stripe.coupons.retrieve(id);
  } catch {
    return await stripe.coupons.create({
      id,
      percent_off: percentOff,
      duration: "once",
      name,
    });
  }
}
