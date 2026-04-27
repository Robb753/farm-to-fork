# 🧠 CLAUDE.md — Farm2Fork

## 🎯 Objectif du projet
Farm2Fork est une plateforme permettant :
- de découvrir des fermes locales via une carte interactive
- de consulter leurs produits
- de permettre aux agriculteurs de gérer leur profil
- d’évoluer vers une marketplace simple et efficace

Philosophie :
→ MVP simple, rapide, lisible
→ UX type Google Maps (info en <3 secondes)
→ performance et clarté > complexité

---

## 🧱 Stack technique

- Next.js (App Router)
- TypeScript (strict)
- Tailwind CSS + DaisyUI
- Supabase (DB + RLS)
- Clerk (auth)
- Mapbox / Google Maps (cartographie)

---

## ⚙️ Règles de développement

### 🔴 Architecture
- Séparer strictement :
  - UI (components)
  - logique métier (hooks / services)
  - data (Supabase)

- ❌ Jamais de logique métier lourde dans les components
- ✅ Toujours passer par des hooks ou services

---

### 🔵 TypeScript
- Toujours typer explicitement
- ❌ Pas de `any`
- ✅ Utiliser des interfaces claires
- ✅ Types centralisés dans `/types`

---

### 🟢 Formulaires
- React Hook Form obligatoire
- Validation avec Zod
- Pas de gestion manuelle du state

---

### 🟣 Supabase
- Utiliser le client centralisé (`@/utils/supabase/client`)
- Toujours respecter les RLS
- Les requêtes doivent être simples et lisibles

- ❌ Pas de logique complexe côté client
- ✅ Préférer des requêtes optimisées

---

### 🟡 Authentification
- Clerk = source de vérité pour auth
- Supabase = données enrichies (profiles)

- Toujours synchroniser :
  - user_id
  - role
  - farm_id

---

## 🧭 UX / UI

### 🎯 Principes
- Lisible en moins de 3 secondes
- Minimaliste
- Mobile-first

---

### 🗺️ Carte
- UX inspirée de Google Maps
- InfoWindow :
  - compacte
  - pas dépendante des images
  - fallback toujours propre

---

### 🧾 Listings
- Carte + liste synchronisées
- Hover → highlight map
- Sélection → focus + zoom

---

### ❤️ Favoris
- Stockés côté utilisateur (Supabase)
- Synchronisés UI / carte / listings

---

## 🚨 Erreurs connues à éviter

### 🔥 React
- ❌ "Maximum update depth exceeded"
  → éviter setState dans useEffect mal contrôlé

---

### 🗺️ Map
- ❌ re-render massif des markers
- ❌ mauvais sync carte / liste
- ✅ utiliser memo + optimisation

---

### 🌐 Fetch
- Toujours gérer AbortController
- Toujours gérer erreurs réseau

---

### 🧠 State
- ❌ duplication de state
- ❌ state inutile
- ✅ state minimal + centralisé

---

## 🧪 Bonnes pratiques

- Toujours proposer une version simple avant complexe
- Toujours expliquer les choix techniques
- Toujours optimiser pour :
  → performance
  → lisibilité
  → maintenabilité

---

## 🧩 Patterns à suivre

### Data fetching
- hooks custom (`useListings`, `useMapData`, etc.)

---

### UI
- composants petits et réutilisables
- jamais de composants monolithiques

---

### Code style
- clair, lisible, sans magie inutile
- éviter over-engineering

---

## 🚀 Workflow avec Claude

### 🔹 Étape 1 — PLAN (obligatoire)
Toujours commencer par :

"Fais un plan détaillé avant d’implémenter.
Challenge ce plan et propose une meilleure version.
N’exécute rien sans validation."

---

### 🔹 Étape 2 — EXÉCUTION
- code propre
- typé
- modulaire

---

### 🔹 Étape 3 — REVIEW
Toujours demander :

"Challenge ce code comme un senior dev.
Améliore la performance et la lisibilité."

---

### 🔹 Étape 4 — REFACTOR
"Refais une version plus élégante et minimaliste."

---

## 🧠 Règles de comportement pour Claude

Tu dois :

- challenger les choix techniques
- refuser les solutions fragiles
- proposer des alternatives meilleures
- expliquer simplement mais précisément

---

## 🔥 Priorités du projet

1. Performance carte + listings
2. UX ultra fluide
3. stabilité (zéro bug critique)
4. code maintenable
5. SEO propre

---

## ❌ À éviter absolument

- complexité inutile
- librairies non nécessaires
- logique dupliquée
- composants trop gros
- code non typé

---

## ✅ Objectif final

Un produit :
- simple
- rapide
- robuste
- agréable à utiliser
- scalable

---
