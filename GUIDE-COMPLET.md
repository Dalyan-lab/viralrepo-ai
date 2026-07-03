# 🚀 ViralRepo.AI — Guide complet (bilan, connecteurs & mise en production)

> Document de référence : ce qui est fait, ce qui reste à brancher, et le pas-à-pas
> détaillé pour passer des **modes démo** à une **connexion réelle** de bout en bout.

---

## PARTIE 1 — CE QUI A ÉTÉ FAIT ✅

### Les 7 sections de l'application
| Page | Route | Rôle | Fonctionne sans clé API ? |
|---|---|---|---|
| Landing marketing | `/` | Vitrine, pricing, CTA | ✅ 100 % |
| Radar IA | `/dashboard` | Repos GitHub en explosion, filtres, bande déroulante | ✅ (vraies données GitHub) |
| Studio viral | `/studio` | Script court + aperçu Reel + export MP4 | ✅ (script démo) |
| Studio de Production | `/production` | Pipeline Unifié 4 étapes (script→images→montage→Shorts) | ✅ (démo) |
| Architecte de Studio IA | `/architect` | Blueprint studio en 4 piliers | ✅ (démo) |
| Avatar parlant | `/avatar` | Lip-sync D-ID + file d'attente | ✅ (démo) |
| Miniatures | `/thumbnails` | Générateur PNG + fond IA + import | ✅ (démo) |
| Administration | `/admin` | Stats + gestion comptes (admin only) | ✅ |

### Socle technique
- **Auth complète** : email/mot de passe (bcrypt + JWT httpOnly), Google + GitHub OAuth, récupération de mot de passe, rôles user/admin, middleware de protection.
- **Compte admin** : `technodalyan@gmail.com` (accès total `/admin`).
- **Base de données** : Prisma + SQLite (users, scripts, avatarJobs, passwordResets).
- **Export vidéo réel** : canvas + MediaRecorder + ffmpeg.wasm auto-hébergé (`public/ffmpeg/`).
- **Design** : Next.js 14, Tailwind, framer-motion, thème clair/sombre, glassmorphism néon.

### Le principe des « modes démo »
Chaque intégration externe a un **repli automatique** : sans clé API, l'app reste
100 % fonctionnelle avec des données simulées crédibles. Brancher une clé =
basculer en réel, **sans toucher au code**.

---

## PARTIE 2 — CONNECTEURS / API / MCP 🔌

### État actuel de chaque service

| Service | Variable `.env` | Rôle dans l'app | Statut | Coût indicatif |
|---|---|---|---|---|
| **Google Gemini** | `GEMINI_API_KEY` | Scripts viraux, blueprint, scripts prod, images (miniatures + scènes) | 🟡 Démo | Gratuit puis ~payant à l'usage |
| **GitHub API** | `GITHUB_TOKEN` | Radar des repos en tendance | 🟢 Réel (limité) | Gratuit |
| **Google OAuth** | `GOOGLE_CLIENT_ID/SECRET` | Connexion « avec Google » | 🟡 Démo | Gratuit |
| **GitHub OAuth** | `GITHUB_CLIENT_ID/SECRET` | Connexion « avec GitHub » | 🟡 Démo | Gratuit |
| **Resend** | `RESEND_API_KEY` | Emails de récupération de compte | 🟡 Démo | Gratuit (3k mails/mois) |
| **D-ID** | `DID_API_KEY` | Avatar parlant (lip-sync) | 🟡 Démo | ~5,9 $/mois + crédits |
| **JWT secret** | `AUTH_SECRET` | Sécurité des sessions | ⚠️ À changer | — |

> 🟢 = déjà réel · 🟡 = démo, prêt à brancher · ⚠️ = à sécuriser avant prod

### À propos des « MCP »
Les **MCP (Model Context Protocol)** sont des connecteurs pour agents IA (Claude, etc.).
**Votre app n'utilise pas de MCP** et n'en a pas besoin : elle appelle directement
les API REST (Gemini, GitHub, D-ID) côté serveur. Les MCP disponibles dans votre
environnement Claude Code (Gmail, Calendar, Drive…) servent à *moi* pour vous
assister, pas à l'application. → **Rien à faire de ce côté.**

---

## PARTIE 3 — GUIDE PAS-À-PAS : PASSER EN RÉEL 🛠️

> Ordre recommandé par impact/effort. Après chaque clé ajoutée dans `.env`,
> **redémarrez le serveur** (`npm run dev`) pour qu'elle soit prise en compte.

### ✅ TÂCHE 1 — Gemini (LA priorité : débloque 80 % de l'IA)
**Impact : ⭐⭐⭐⭐⭐ · Effort : 5 min · Gratuit pour démarrer**

1. Allez sur https://aistudio.google.com/apikey
2. Connectez-vous, cliquez **« Create API key »**.
3. Copiez la clé.
4. Dans `.env` : `GEMINI_API_KEY="votre_clé_ici"`
5. Vérifiez le modèle : `GEMINI_MODEL="gemini-2.5-pro"` (⚠️ voir note ci-dessous).
6. Redémarrez → les scripts, blueprints et images sont désormais **générés par l'IA**.

> ⚠️ **Note importante** : le `.env` mentionne `gemini-3.1-pro` et
> `gemini-2.5-flash-image`. Vérifiez les noms de modèles réellement disponibles
> sur votre compte (les identifiants évoluent). En cas de nom invalide, l'app
> retombe automatiquement en démo — donc testez après avoir mis la clé.

---

### ✅ TÂCHE 2 — GitHub Token (radar plus rapide & fiable)
**Impact : ⭐⭐⭐ · Effort : 3 min · Gratuit**

1. https://github.com/settings/tokens → **« Generate new token (classic) »**.
2. Aucune permission (`scope`) nécessaire — juste un token pour lever la limite.
3. Copiez-le.
4. `.env` : `GITHUB_TOKEN="ghp_..."`
5. Redémarrez → passe de **10 à 30 requêtes/min** (moins de mode démo sur le radar).

---

### ✅ TÂCHE 3 — Connexion Google (OAuth)
**Impact : ⭐⭐⭐⭐ · Effort : 15 min · Gratuit**

1. https://console.cloud.google.com → créez un projet (ou réutilisez-en un).
2. Menu **« API et services » → « Écran de consentement OAuth »** :
   - Type : Externe · Nom de l'app : ViralRepo.AI · email de support.
3. **« Identifiants » → « Créer des identifiants » → « ID client OAuth »** :
   - Type d'application : **Application Web**.
   - **URI de redirection autorisé** :
     `http://localhost:3000/api/auth/oauth/google/callback`
     (et votre domaine en prod : `https://votredomaine.com/api/auth/oauth/google/callback`)
4. Copiez l'**ID client** et le **secret client**.
5. `.env` :
   ```
   GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="xxx"
   ```
6. Redémarrez → le bouton **« Google »** connecte réellement.

---

### ✅ TÂCHE 4 — Connexion GitHub (OAuth)
**Impact : ⭐⭐⭐ · Effort : 10 min · Gratuit**

1. https://github.com/settings/developers → **« New OAuth App »**.
2. Remplissez :
   - Application name : ViralRepo.AI
   - Homepage URL : `http://localhost:3000`
   - **Authorization callback URL** :
     `http://localhost:3000/api/auth/oauth/github/callback`
3. Créez, puis générez un **« Client secret »**.
4. `.env` :
   ```
   GITHUB_CLIENT_ID="Iv1..."
   GITHUB_CLIENT_SECRET="xxx"
   ```
5. Redémarrez → le bouton **« GitHub »** connecte réellement.

---

### ✅ TÂCHE 5 — Emails de récupération (Resend)
**Impact : ⭐⭐⭐ · Effort : 10 min · Gratuit (3 000 mails/mois)**

1. https://resend.com → créez un compte.
2. **API Keys → Create API Key**, copiez-la.
3. (Recommandé) **Domains** → ajoutez et vérifiez votre domaine pour envoyer
   depuis `noreply@votredomaine.com`. Sinon, Resend fournit un domaine de test.
4. `.env` : `RESEND_API_KEY="re_..."`
5. Dans `src/app/api/auth/forgot/route.ts`, adaptez le champ `from:` à votre
   domaine vérifié.
6. Redémarrez → le lien de réinitialisation part **par email** (au lieu de
   s'afficher à l'écran).

---

### ✅ TÂCHE 6 — Avatar parlant réel (D-ID)
**Impact : ⭐⭐⭐ · Effort : 15 min · Payant (~5,9 $/mois)**

1. https://www.d-id.com → créez un compte, choisissez un plan avec crédits API.
2. **API Keys** dans votre profil, copiez la clé.
3. `.env` : `DID_API_KEY="votre_clé"`
4. **Important** : D-ID a besoin d'une **photo de visage hébergée publiquement**
   (URL https). L'import local sert d'aperçu ; pour le rendu réel, hébergez la
   photo (voir Tâche 8 — stockage).
5. **Webhook** : renseignez `APP_URL` avec votre URL publique. En local, utilisez
   un tunnel (ex. `ngrok http 3000`) pour que D-ID puisse notifier `/api/webhooks/did`.
   Sans webhook joignable, l'app interroge D-ID en direct (polling) — ça marche
   quand même.
6. Redémarrez → les avatars sont **réellement animés**.

---

### ⚠️ TÂCHE 7 — Sécuriser avant la mise en ligne
**Impact : ⭐⭐⭐⭐⭐ (obligatoire) · Effort : 5 min**

1. **Changez `AUTH_SECRET`** par une chaîne aléatoire longue :
   ```bash
   # génère un secret solide
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
   Collez le résultat dans `AUTH_SECRET`.
2. Ne **jamais** committer `.env` (déjà dans `.gitignore` ✅).
3. Changez le mot de passe admin après le premier login.

---

### 🌐 TÂCHE 8 — Déploiement en production
**Impact : ⭐⭐⭐⭐⭐ · Effort : 1-2 h**

L'app tourne en local ; pour la mettre en ligne il faut 3 choses :

#### 8a. Base de données de production (SQLite → PostgreSQL)
SQLite ne convient pas au cloud. Migrez vers Postgres (gratuit chez Neon/Supabase) :
1. Créez une base sur https://neon.tech (ou supabase.com).
2. Dans `prisma/schema.prisma`, changez :
   ```prisma
   datasource db {
     provider = "postgresql"   // au lieu de "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
3. `.env` : `DATABASE_URL="postgresql://...votre_url_neon..."`
4. `npx prisma db push` puis `node prisma/seed.mjs` (recrée l'admin).

#### 8b. Hébergement (Vercel — recommandé pour Next.js)
1. Poussez le code sur un dépôt GitHub (privé).
2. https://vercel.com → **Import Project** → sélectionnez le dépôt.
3. Ajoutez **toutes les variables `.env`** dans les *Environment Variables* Vercel.
4. Mettez `APP_URL="https://votre-app.vercel.app"`.
5. Déployez. ⚠️ Mettez à jour les **URI de callback OAuth** (Tâches 3 & 4) avec
   l'URL de prod.

#### 8c. Stockage des fichiers (images/vidéos/avatars)
Pour héberger les photos d'avatar (D-ID) et archiver les rendus :
- **Cloudflare R2** (gratuit jusqu'à 10 Go, sans frais de sortie) ou **AWS S3**.
- Ajoutez une route d'upload qui stocke le fichier et renvoie une URL publique,
  utilisée ensuite comme `source_url` D-ID.

---

## PARTIE 4 — MES « PLUS » POUR ALLER PLUS LOIN 💎

Voici ce que je peux ajouter pour transformer l'app en produit commercial complet.
Classé par valeur business.

### 💰 PLUS n°1 — Monétisation Stripe (le plus rentable)
La landing affiche déjà 3 plans (0/19/49 €) mais les boutons ne facturent pas.
Je peux brancher **Stripe Checkout** :
- Paiement par carte, abonnements mensuels, gestion des annulations.
- Table `Subscription` + webhook Stripe pour débloquer les fonctions premium.
- Limitation d'usage par plan (ex. 3 scripts/jour en gratuit).
> **Effort : ~3 h · Impact business : maximal** (c'est ce qui génère du revenu).

### 🎬 PLUS n°2 — Vraie génération vidéo (Runway / Luma / Pika)
Aujourd'hui le montage anime des images fixes (Ken Burns). Je peux brancher
**Runway Gen-3** ou **Luma Dream Machine** (API) pour transformer les images clés
en **plans vidéo animés** — exactement le pilier 1 de votre blueprint Architecte.
> **Effort : ~4 h · Coût : crédits API vidéo (assez chers, à réserver aux plans premium).**

### 🎙️ PLUS n°3 — Voix off IA professionnelle (ElevenLabs)
Le TTS actuel est celui du navigateur (correct mais robotique). **ElevenLabs**
donne des voix ultra-réalistes multilingues + **clonage de votre voix**.
- Route serveur `/api/tts` qui renvoie l'audio, muxé dans le MP4.
> **Effort : ~2 h · Coût : ~5 $/mois pour démarrer.**

### 📈 PLUS n°4 — Publication automatique (au lieu du partage manuel)
Aujourd'hui les boutons ouvrent X/TikTok/YouTube. Je peux brancher les **API de
publication officielles** (YouTube Data API, TikTok Content Posting API) pour
**publier directement** depuis l'app, avec planification.
> **Effort : ~6 h · Nécessite validation des plateformes (délais d'approbation).**

### 🗂️ PLUS n°5 — File d'attente robuste (BullMQ / Redis)
Le rendu D-ID utilise une file simple en base. Pour la montée en charge (plusieurs
utilisateurs simultanés), je peux ajouter une **vraie file Redis** avec reprise sur
erreur, priorités par plan, et tableau de suivi des jobs.
> **Effort : ~4 h · Utile seulement à partir de dizaines d'utilisateurs actifs.**

### 📊 PLUS n°6 — Analytics & rétention
- Historique complet des contenus par utilisateur (déjà en base, à exposer).
- Dashboard « mes performances » : quels repos ont le mieux marché.
- Emails de relance (« 3 nouveaux repos explosifs cette semaine »).
> **Effort : ~3 h · Impact : fidélisation.**

---

## 🎯 PLAN D'ACTION RECOMMANDÉ (ordre optimal)

**Phase 1 — Rendre l'IA réelle (30 min, gratuit)**
→ Tâches 1 (Gemini) + 2 (GitHub token). L'app devient pleinement intelligente.

**Phase 2 — Connexions & comptes (35 min, gratuit)**
→ Tâches 3 (Google) + 4 (GitHub OAuth) + 5 (Resend) + 7 (sécurité).

**Phase 3 — Mise en ligne (1-2 h)**
→ Tâche 8 (Postgres + Vercel + stockage). L'app est publique.

**Phase 4 — Monétiser (3 h)**
→ PLUS n°1 (Stripe). L'app génère du revenu.

**Phase 5 — Premium différenciant (au choix)**
→ PLUS n°2/3 (vraie vidéo + voix ElevenLabs) pour justifier les plans payants.

---

*Dites-moi quelle phase vous voulez attaquer : je peux tout coder pour vous —
il vous restera juste à créer les comptes et coller les clés.*
