# TruckCheck — État des lieux de camions

Application web pour gérer les états des lieux de véhicules : photos, signatures, comparaison départ/retour, génération PDF et envoi email.

---

## Installation (première fois)

1. Installez [Node.js LTS](https://nodejs.org)
2. Installez [VS Code](https://code.visualstudio.com)
3. Installez [GitHub Desktop](https://desktop.github.com)

---

## Lancer le projet en local

```bash
npm install
npm run dev
```

Puis ouvrez http://localhost:3000 dans votre navigateur.

---

## Configurer l'envoi d'emails

1. Créez un compte gratuit sur https://resend.com
2. Créez une clé API
3. Copiez `.env.local.example` → `.env.local`
4. Collez votre clé API : `RESEND_API_KEY=re_votre_cle`
5. Dans `/app/api/send-pdf/route.ts`, remplacez `noreply@votre-domaine.com` par votre email vérifié Resend

---

## Déployer sur Vercel

1. Publiez le projet sur GitHub via GitHub Desktop
2. Connectez-vous sur https://vercel.com avec votre compte GitHub
3. Cliquez "New Project" → importez ce dépôt
4. Dans les settings Vercel, ajoutez la variable : `RESEND_API_KEY`
5. Cliquez "Deploy"

Votre app est en ligne !

---

## Structure des fichiers

```
truckcheck/
├── app/
│   ├── layout.tsx          # Structure HTML principale
│   ├── page.tsx            # Page d'accueil
│   ├── globals.css         # Styles globaux
│   └── api/send-pdf/
│       └── route.ts        # API envoi email
├── components/
│   ├── TruckCheckApp.tsx   # Application principale (4 onglets)
│   ├── FuelBar.tsx         # Jauge carburant interactive
│   ├── PhotoGrid.tsx       # Grille photos avec notes
│   └── SignatureCanvas.tsx # Zone de signature tactile
├── lib/
│   ├── types.ts            # Types TypeScript
│   └── generatePDF.ts      # Génération du PDF comparatif
└── .env.local              # Vos clés API (ne pas commiter)
```
