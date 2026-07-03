# 🌐 Phase 3 — Mettre ViralRepo.AI en ligne

> Objectif : passer de `localhost` à une app **publique**, accessible par n'importe qui.
> Durée : ~1 à 2 h. Coût : **gratuit** pour démarrer (Neon + Vercel + GitHub gratuits).

Trois briques : une **base de données cloud** (Neon), un **dépôt de code** (GitHub),
un **hébergeur** (Vercel). On les branche dans cet ordre.

---

## ✅ Ce que j'ai déjà préparé côté code

- **Export MP4 compatible Vercel** : le moteur ffmpeg (31 Mo) se charge désormais
  depuis un CDN, plus besoin de committer un gros binaire.
- **OAuth compatible production** : les redirections utilisent `APP_URL` (https garanti
  derrière le proxy Vercel).
- **`.env.example`** à jour, `prisma generate` déjà branché au build.

Il reste **vos 3 comptes cloud** à créer (je ne peux pas le faire à votre place),
puis je finalise et vérifie avec vous.

---

## ÉTAPE 1 — Base de données PostgreSQL (Neon) · ~10 min

SQLite (fichier local) ne fonctionne pas sur un hébergeur serverless. On passe à Postgres.

1. Allez sur **https://neon.tech** → inscrivez-vous (gratuit, connexion Google possible).
2. **Create Project** → nom « viralrepo » → région proche de vous (Europe).
3. Neon affiche une **Connection string** de la forme :
   `postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
4. **Copiez-la** et gardez-la sous la main.
5. Dites-le moi : je bascule le schéma Prisma en PostgreSQL, je crée les tables et
   le compte admin dans Neon (`db push` + `seed`). *(1 ligne à changer + 2 commandes.)*

> 💡 Cette même base servira en **local ET en production** — une seule base à gérer.

---

## ÉTAPE 2 — Dépôt de code (GitHub) · ~10 min

Vercel déploie depuis un dépôt Git.

1. Créez un dépôt **privé** sur **https://github.com/new** → nom « viralrepo-ai »
   (⚠️ privé : le code contient votre logique métier).
2. Dites-le moi : je prépare le dépôt localement (`git init`, premier commit) et je
   vous donne les 2 commandes exactes à coller pour l'envoyer sur GitHub.
   *(Le fichier `.env` avec vos secrets n'est JAMAIS envoyé — il est déjà exclu.)*

---

## ÉTAPE 3 — Hébergement (Vercel) · ~15 min

1. Allez sur **https://vercel.com** → inscrivez-vous **avec GitHub** (le plus simple).
2. **Add New → Project** → importez le dépôt « viralrepo-ai ».
3. Vercel détecte Next.js automatiquement — ne touchez pas aux réglages de build.
4. Avant de déployer, ouvrez **Environment Variables** et ajoutez **toutes** les
   variables de votre `.env` (je vous donnerai la liste exacte à copier), avec :
   - `DATABASE_URL` = votre URL Neon
   - `APP_URL` = `https://votre-projet.vercel.app` (l'URL que Vercel vous attribue)
   - toutes les clés (Gemini, GitHub, Google, Resend, AUTH_SECRET…)
5. **Deploy**. Au bout de ~2 min, votre app est en ligne 🎉.

---

## ÉTAPE 4 — Reconnecter les services au domaine de production · ~10 min

Une fois l'URL Vercel connue (ex. `https://viralrepo-ai.vercel.app`) :

1. **Google OAuth** → console.cloud.google.com → votre ID client → ajoutez l'URI :
   `https://viralrepo-ai.vercel.app/api/auth/oauth/google/callback`
2. **GitHub OAuth** → github.com/settings/developers → votre app → mettez à jour :
   `https://viralrepo-ai.vercel.app/api/auth/oauth/github/callback`
   (GitHub n'autorise qu'une seule callback URL par app — créez-en une 2ᵉ pour la prod,
   ou remplacez celle de dev.)
3. **APP_URL** dans Vercel = l'URL de production (déjà fait à l'étape 3).
4. **Emails** : pour écrire à tous vos utilisateurs (pas seulement vous), vérifiez un
   domaine sur **resend.com/domains** puis mettez `EMAIL_FROM="ViralRepo.AI <noreply@votredomaine.com>"`.
5. **Compte admin** : reconnectez-vous et changez le mot de passe admin.

---

## 📌 À savoir

- **Avatars D-ID** : le rendu en tâche de fond ne se termine pas de façon fiable sur
  Vercel (fonctions serverless gelées après réponse). À activer plus tard avec une
  vraie file d'attente (Redis) — non bloquant, l'avatar est optionnel.
- **Domaine personnalisé** : dans Vercel → Settings → Domains, vous pourrez brancher
  `viralrepo.ai` ou tout autre domaine que vous achetez (~12 €/an).
- **Coûts** : Neon, Vercel et GitHub ont des offres gratuites généreuses. Vous ne
  payez que si le trafic explose (bonne nouvelle 😄).

---

## 🎯 Par où commencer

Créez d'abord le **compte Neon** (Étape 1) et donnez-moi la connection string :
je bascule la base en production et on enchaîne GitHub + Vercel dans la foulée.
