import crypto from "crypto";

// Intégration Paystack (Côte d'Ivoire) — cartes internationales + Mobile Money
// (Wave, Orange Money, MTN, Moov), versement en FCFA sur banque locale.
// Sans PAYSTACK_SECRET_KEY : mode démo (l'UI affiche un message d'aide).

const API = "https://api.paystack.co";

export function paystackConfigured(): boolean {
  return !!process.env.PAYSTACK_SECRET_KEY;
}

export type PlanId = "createur" | "studio";

// Prix en FCFA (XOF). ⚠️ Paystack attend le montant en "subunit" → ×100.
// À VÉRIFIER en mode test : le montant affiché sur la page Paystack doit
// correspondre (ex. 10 000 FCFA). Si c'est ×100 trop grand, mettre SUBUNIT=1.
const SUBUNIT = 100;

export const PLANS: Record<
  PlanId,
  { name: string; amountXOF: number; label: string }
> = {
  createur: { name: "ViralRepo.AI — Créateur", amountXOF: 10000, label: "10 000 FCFA / mois" },
  studio: { name: "ViralRepo.AI — Studio", amountXOF: 25000, label: "25 000 FCFA / mois" },
};

export const PLAN_LABELS: Record<string, string> = {
  decouverte: "Découverte (gratuit)",
  createur: "Créateur",
  studio: "Studio",
};

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

/** Initialise une transaction et renvoie l'URL de paiement hébergée Paystack. */
export async function paystackInitialize(params: {
  email: string;
  amountXOF: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, any>;
}): Promise<{ authorization_url: string } | null> {
  const res = await fetch(`${API}/transaction/initialize`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email: params.email,
      amount: Math.max(0, Math.round(params.amountXOF * SUBUNIT)),
      currency: "XOF",
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
      channels: ["card", "mobile_money", "bank_transfer", "qr", "ussd"],
    }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ? { authorization_url: json.data.authorization_url } : null;
}

/** Vérifie une transaction par sa référence. */
export async function paystackVerify(reference: string): Promise<{
  success: boolean;
  metadata?: Record<string, any>;
  authorizationCode?: string;
  customerCode?: string;
} | null> {
  const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const d = json.data;
  if (!d) return null;
  return {
    success: d.status === "success",
    metadata: d.metadata,
    authorizationCode: d.authorization?.authorization_code,
    customerCode: d.customer?.customer_code,
  };
}

/** Prélève un montant sur une autorisation existante (renouvellement auto,
 *  off-session). Fonctionne pour les cartes ; le Mobile Money peut exiger
 *  l'accord de l'utilisateur (le renouvellement échoue alors → à faire manuellement). */
export async function paystackChargeAuthorization(params: {
  email: string;
  amountXOF: number;
  authorizationCode: string;
  reference: string;
  metadata: Record<string, any>;
}): Promise<boolean> {
  const res = await fetch(`${API}/transaction/charge_authorization`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amountXOF * SUBUNIT),
      currency: "XOF",
      authorization_code: params.authorizationCode,
      reference: params.reference,
      metadata: params.metadata,
    }),
  });
  if (!res.ok) return false;
  const json = await res.json();
  return json.data?.status === "success";
}

/** Vérifie la signature d'un webhook Paystack (HMAC SHA512 du corps brut). */
export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || !signature) return false;
  const hash = crypto.createHmac("sha512", key).update(rawBody).digest("hex");
  return hash === signature;
}
