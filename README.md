# ⚡ ViralRepo.AI

**Détectez les dépôts IA en pleine explosion sur GitHub et transformez-les en vidéos virales prêtes à publier — en quelques clics.**

SaaS complet : radar GitHub temps réel, script viral généré par IA en streaming, aperçu Reel vertical animé, export MP4 sans montage, voix off, avatar parlant et miniatures.

---

## 🚀 Démarrage rapide

```bash
npm install        # installe les dépendances (+ génère le client Prisma)
npm run db:push    # crée la base SQLite locale
npm run dev        # lance l'app sur http://localhost:3000
```

Créez un compte (email + mot de passe) et c'est parti. **L'app fonctionne immédiatement sans aucune clé API** grâce aux modes démo intégrés.

## 🔑 Clés API (optionnelles mais recommandées)

À renseigner dans `.env` :

| Variable | Rôle | Sans la clé |
|---|---|---|
| `GEMINI_API_KEY` | Génération des scripts par **Gemini** ([aistudio.google.com](https://aistudio.google.com)) + fonds de miniatures IA | Mode démo : script simulé + fond néon procédural |
| `GEMINI_MODEL` / `GEMINI_IMAGE_MODEL` | Modèles texte / image | — |
| `GITHUB_TOKEN` | Augmente la limite de l'API GitHub (10 → 30 req/min) | Fonctionne, avec cache 5 min |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | **Connexion Google** (callback : `{APP_URL}/api/auth/oauth/google/callback`) | Bouton affiché, message « non configuré » |
| `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` | **Connexion GitHub** (callback : `{APP_URL}/api/auth/oauth/github/callback`) | idem |
| `RESEND_API_KEY` | Envoi par **email** du lien de récupération de mot de passe | Le lien s'affiche à l'écran (mode démo) |
| `DID_API_KEY` | Avatar parlant lip-sync réel ([d-id.com](https://www.d-id.com)) | Mode démo : vidéo d'exemple après 8 s |
| `APP_URL` | URL publique (webhook D-ID + callbacks OAuth) | Repli automatique sur du polling |
| `AUTH_SECRET` | Secret des sessions JWT — **à changer en production** | — |

## 👑 Administration

Un compte **admin** (accès total) est créé par `node prisma/seed.mjs` : `technodalyan@gmail.com`.
L'espace `/admin` donne : statistiques globales, liste des comptes (promotion/rétrogradation admin, suppression), derniers scripts générés. Le lien « Admin » apparaît dans la barre de navigation pour les administrateurs uniquement.

## ✨ Fonctionnalités

- **Radar IA temps réel** — scanne l'API GitHub officielle, classe les repos IA par vélocité (⭐/jour) avec badges : 🔥 EXPLOSIF, EN FUSION, MONTÉE RAPIDE, TENDANCE. Bande déroulante des repos chauds, filtres par **catégorie** (Toute l'IA, LLMs, Agents, RAG, Vision, Voix) et **période** (Chaud / Mois / Année), logos des dépôts et détails (étoiles, forks, âge, langage). Rafraîchissement auto toutes les 5 min.
- **Connexion Google / GitHub** (OAuth) + email/mot de passe + **récupération de compte** (lien sécurisé 30 min, envoi email via Resend ou affichage direct en mode démo).
- **Miniatures IA** — décrivez le fond souhaité, Gemini le génère (ou fond néon procédural en mode démo) ; **import d'image** possible, avec voile sombre automatique pour la lisibilité du titre.
- **Studio de Production** (`/production`) — le « Pipeline Unifié » **opérationnel** en 4 étapes : ① Idéation & Scripting (script deux colonnes AUDIO / VISUEL généré en streaming, scène par scène) ; ② Production des Assets (une image IA par scène via Gemini — ou visuel néon procédural en démo — + pré-écoute TTS + enregistrement/import de voix off) ; ③ Montage automatique (effet Ken Burns, sous-titres dynamiques synchronisés, fondus, voix muxée) et **export MP4** ; ④ Déclinaison cross-canal (l'IA détecte les 3 hooks au plus fort potentiel viral avec score /10, chacun exportable en **Short 9:16** sous-titré avec texte à l'écran). ffmpeg.wasm est auto-hébergé dans `public/ffmpeg/` (fonctionne hors-ligne ; le transcodage MP4 prend quelques minutes, un repli WebM automatique est prévu).
- **Architecte de Studio IA** (`/architect`) — une idée brute entre, un blueprint professionnel sort : l'IA joue l'Architecte de Systèmes IA / Directeur de Post-Production senior et livre en streaming les 4 piliers du « Pipeline Unifié » (Tech Stack outil par outil, workflow pas-à-pas, 3 Prompts Maîtres réutilisables, conseils pro cohérence/coûts/stockage), avec niche et niveau de budget paramétrables, export Markdown et copie en un clic.
- **Script viral en 1 clic** — streaming mot-à-mot, calibré par plateforme (TikTok / Reels / Shorts courts et punchy, YouTube long format). Éditable, sauvegardé en base.
- **Aperçu Reel vertical (9:16)** — maquette animée avec texte incrusté façon karaoké, pour visualiser le rendu avant de tourner.
- **Export MP4 réel** — canvas + MediaRecorder + transcodage **ffmpeg.wasm**, 100 % côté client. Vidéo verticale 720×1280 prête à publier, sans logiciel de montage. (Repli WebM si ffmpeg est indisponible.)
- **Voix off** — TTS synchronisée avec les légendes dans l'aperçu ; enregistrez ou importez **votre propre voix**, elle est muxée dans le MP4 exporté.
- **Avatar qui parle** — présentateur animé lip-sync via D-ID, avec **file d'attente + webhook** (`/api/webhooks/did`) et notification navigateur : l'utilisateur n'est jamais bloqué pendant le rendu.
- **Miniatures percutantes** — générateur 1280×720 (titre choc, dégradés néon, emoji, badge), export PNG.
- **Partage direct** — X (tweet pré-rempli), TikTok, YouTube Studio, export `.txt`.
- **Auth email/mot de passe** — bcrypt + JWT httpOnly, routes protégées par middleware.
- **Design futuriste pro** — glassmorphism, néons, grille animée, framer-motion, **mode clair/sombre**.

## 🏗️ Stack technique

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS + framer-motion
- **Prisma + SQLite** (users, scripts, jobs avatar)
- **API GitHub** (search + vélocité), **Gemini** (streaming SSE), **D-ID** (talks + webhook)
- **ffmpeg.wasm** chargé à la demande depuis CDN pour le transcodage MP4

## 📁 Structure

```
src/
├── app/
│   ├── page.tsx              # Landing marketing
│   ├── dashboard/            # Radar IA temps réel
│   ├── studio/               # Génération + aperçu Reel + export MP4
│   ├── avatar/               # Avatar parlant (file d'attente)
│   ├── thumbnails/           # Générateur de miniatures
│   ├── login/ · register/    # Authentification
│   └── api/                  # auth, trending, generate (stream), scripts,
│                             # avatar (queue), webhooks/did
├── components/               # Navbar, ReelPreview, AuthForm…
├── lib/                      # auth (JWT), github, gemini, exportVideo
└── middleware.ts             # Protection des routes
```

## 📌 Notes

- L'export MP4 nécessite un navigateur Chromium (Chrome/Edge) pour `canvas.captureStream` + `MediaRecorder`.
- La voix TTS joue en direct dans l'aperçu ; pour inclure une voix dans le MP4, utilisez l'enregistrement micro ou l'import audio (limitation navigateur : `speechSynthesis` n'est pas capturable).
- Pour le rendu D-ID réel, utilisez une photo de visage **hébergée publiquement** (l'import local sert d'aperçu et au mode démo).
