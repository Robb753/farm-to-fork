# 🛒 Changelog - Onglet Boutique

## 📅 Date : 24 Décembre 2025

### ✨ Transformation de l'onglet "Produits" en "Boutique"

L'ancien onglet **"Produits"** (qui affichait uniquement des badges) a été remplacé par un onglet **"Boutique"** permettant l'achat direct dans la fiche ferme.

---

## 🎯 Objectifs

- ✅ **Tunnel fermé** : Achat uniquement chez UNE ferme à la fois
- ✅ **UX simplifiée** : Pas de map, téléphone, liens externes dans le flow d'achat
- ✅ **Expérience e-commerce** : Liste produits → Panier → Commande

---

## 🆕 Nouvelles fonctionnalités

### 1. **Onglet Boutique** (remplace l'onglet Produits)

**Avant** :
- 🥕 Onglet "Produits"
- Affichage de badges de catégories
- Pas de prix, pas d'achat direct

**Après** :
- 🛒 Onglet "Boutique"
- Liste de produits ACHETABLES
- Prix et unités affichés
- Contrôles quantité +/-
- Ajout au panier direct

### 2. **Liste produits achetables**

Chaque produit affiche :
- ✅ Nom du produit
- ✅ Prix (ex: 2,00 € / kg)
- ✅ Unité (kg, pièce, douzaine, etc.)
- ✅ Description (optionnelle)
- ✅ Statut stock (🟢 En stock, 🟡 Stock faible, 🔴 Rupture)

### 3. **Contrôles quantité**

- Bouton "Ajouter" pour les produits non encore dans le panier
- Contrôles **+/-** pour ajuster la quantité
- Affichage de la quantité actuelle
- Désactivation si rupture de stock

### 4. **Mini panier sticky**

Apparaît en bas de l'onglet quand des produits sont ajoutés :
- 🛒 Nombre d'articles
- 💰 Total du panier
- Bouton "Voir le panier" → redirige vers `/shop/[farmId]/panier`

### 5. **Badge tunnel fermé**

Badge visible en haut : **"🔒 Achat exclusif chez [Nom de la ferme]"**
- Rappelle qu'on achète uniquement chez cette ferme
- Cohérent avec la logique tunnel fermé

### 6. **Modes de réception**

Section affichant les options disponibles :
- 📍 **Retrait** : Jours et horaires (si configurés)
- 🚚 **Livraison locale** : Si disponible

### 7. **Vérification compatibilité panier**

- Si l'utilisateur a déjà un panier d'une autre ferme :
  - Toast d'avertissement
  - Blocage de l'ajout au panier
  - Message : "Videz votre panier pour acheter chez une autre ferme"

---

## 📂 Fichiers modifiés

### Nouveaux fichiers

```
app/(routes)/view-listing/_components/BoutiqueTab.tsx (397 lignes)
```

### Fichiers modifiés

```
app/(routes)/view-listing/[id]/viewlisting.tsx
- Import ProductsTab → BoutiqueTab
- Type TabValue: "produits" → "boutique"
- Config onglet: label "Produits" → "Boutique", icon 🥕 → 🛒
- TabsContent: value "produits" → "boutique"
```

---

## 🔧 Architecture technique

### Composant BoutiqueTab.tsx

**Responsabilités** :
- Charger les produits depuis Supabase (`products` table)
- Gérer l'ajout au panier via `cartStore`
- Afficher le mini panier sticky
- Rediriger vers la page panier
- Vérifier la compatibilité du panier

**Props** :
```typescript
interface BoutiqueTabProps {
  listing: ListingWithProducts | null;
  className?: string;
}
```

**Hooks utilisés** :
- `useState` : produits, isLoading
- `useEffect` : chargement produits, vérification panier
- `useRouter` : navigation vers panier
- `useCartStore` : gestion du panier Zustand

**Intégrations** :
- Supabase : table `products`
- Store : `cartStore.ts`
- UI : `sonner` (toasts), `lucide-react` (icons)
- Routing : Next.js App Router

---

## 🎨 Design

### Cohérence visuelle

- **Couleurs** : Utilise `COLORS` du config (PRIMARY, SUCCESS, etc.)
- **Espacement** : Cohérent avec le reste de l'app
- **Responsive** : Fonctionne sur mobile, tablet, desktop
- **États** : Chargement, vide, erreur

### Composants UI

- **ProductCard** : Carte produit avec contrôles
- **Mini panier sticky** : Barre fixe en bas
- **Badge tunnel** : Rappel visuel
- **Section modes réception** : Info pratique

---

## 🔄 Flow utilisateur

### Ancien flow (onglet Produits)

1. Utilisateur visite la fiche ferme
2. Clique sur onglet "Produits"
3. Voit des badges de catégories (Légumes, Fruits, etc.)
4. Pas d'action possible (juste affichage)

### Nouveau flow (onglet Boutique)

1. Utilisateur visite la fiche ferme
2. Clique sur onglet **"Boutique"** 🛒
3. Voit la **liste de produits achetables** avec prix
4. Clique sur **"Ajouter"** → Produit ajouté au panier
5. Ajuste la **quantité** avec +/-
6. Voit le **mini panier** apparaître en bas
7. Clique sur **"Voir le panier"**
8. Redirigé vers `/shop/[farmId]/panier`
9. Finalise la commande (choix retrait/livraison)

---

## 🚀 Prochaines étapes

### Améliorations possibles

1. **Filtres produits** :
   - Par catégorie (Légumes, Fruits, etc.)
   - Par disponibilité (En stock, Rupture)
   - Par prix

2. **Images produits** :
   - Afficher `image_url` du produit
   - Fallback image par défaut

3. **Suggestions** :
   - "Les clients ont aussi acheté..."
   - "Produits populaires"

4. **Promotions** :
   - Badge "Promo"
   - Prix barré
   - Pourcentage de réduction

5. **Favoris produits** :
   - Liste de souhaits
   - Rappels de saisonnalité

---

## 📊 Données Supabase

### Table `products` utilisée

```sql
SELECT
  id,
  farm_id,
  name,
  description,
  price,
  unit,
  image_url,
  stock_status,
  active
FROM products
WHERE farm_id = [farmId] AND active = true
ORDER BY name;
```

### Colonnes `listings` utilisées

- `pickup_days` : Jours de retrait
- `delivery_available` : Livraison dispo ?
- `delivery_days` : Jours de livraison

---

## ✅ Tests recommandés

### Scénarios à tester

1. **Produits disponibles** :
   - ✅ Affichage correct de la liste
   - ✅ Prix et unités visibles
   - ✅ Ajout au panier fonctionnel

2. **Aucun produit** :
   - ✅ Message "Boutique en préparation"
   - ✅ Pas de crash

3. **Panier incompatible** :
   - ✅ Toast d'avertissement
   - ✅ Blocage de l'ajout
   - ✅ Message clair

4. **Navigation** :
   - ✅ Redirection vers panier OK
   - ✅ Retour à la fiche ferme OK

5. **Responsive** :
   - ✅ Mobile : mini panier sticky visible
   - ✅ Desktop : layout correct

---

## 🐛 Points d'attention

### Limitations actuelles

1. **Pas de gestion stock avancée** :
   - Stock statique (in_stock, low_stock, out_of_stock)
   - Pas de quantité disponible dynamique

2. **Pas de filtres** :
   - Tous les produits affichés
   - Peut être long si > 50 produits

3. **Pas d'images produits** :
   - `image_url` chargé mais pas affiché
   - À implémenter plus tard

4. **Sidebar conservée** :
   - ContactCard, MapCard, OpeningHoursCard encore visibles
   - Pas complètement "tunnel fermé" (mais acceptable)

---

## 📝 Notes techniques

### Store Zustand (cartStore.ts)

Le panier est géré globalement via `cartStore.ts` :
- Persisté dans localStorage
- Tunnel fermé : 1 seule ferme par panier
- Actions : addItem, removeItem, updateQuantity, clearCart

### Intégration seamless

Le nouvel onglet Boutique s'intègre parfaitement avec :
- `/shop/[farmId]/panier` : page panier
- `/shop/[farmId]/boutique` : boutique standalone
- `/shop/commande/[orderId]` : confirmation
- `/dashboard/commandes` : dashboard producteur

---

## 🎉 Résumé

**Avant** :
- Onglet "Produits" = Simple affichage de badges
- Pas d'achat possible
- Pas de prix, pas de panier

**Après** :
- Onglet "Boutique" = Véritable boutique en ligne
- Achat direct avec panier
- Prix, unités, stock, contrôles quantité
- Tunnel fermé cohérent
- Redirection vers flow complet

---

**Auteur** : Claude (Anthropic)
**Date** : 24 Décembre 2025
**Branche** : `claude/farm-shop-ux-design-0XzHc`
**Commits** : 2 (Initial shop UX + Boutique tab)
