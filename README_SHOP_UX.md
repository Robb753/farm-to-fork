# UX Shop "Supermarché-like" - Guide d'implémentation

## 📋 Vue d'ensemble

Cette implémentation apporte une expérience d'achat "supermarché-like" au projet Farm-to-Fork, optimisée pour des actifs habitués au e-commerce.

## 🎯 Objectifs

- **Simplicité** : Interface familière type supermarché en ligne
- **Tunnel fermé** : On achète uniquement chez une ferme à la fois
- **Rassurant** : Badges, codes, statuts clairs
- **Mobile-first** : Panier sticky, design responsive

## 🗺️ Flow utilisateur

### 1️⃣ Carte/Liste des fermes (`/shop`)
- Vue d'ensemble des producteurs locaux
- Badges "Livraison locale disponible"
- Bouton CTA "Voir la ferme"

### 2️⃣ Page Ferme (`/shop/[farmId]`)
- Vitrine de la ferme avec informations pratiques
- CTA principal "Entrer dans la boutique"
- Sous-texte : "Vous achetez uniquement chez cette ferme"

### 3️⃣ Boutique (`/shop/[farmId]/boutique`)
- Header fixe rappelant chez qui on achète
- Liste produits simple avec contrôles quantité
- Mini panier sticky bottom

### 4️⃣ Panier (`/shop/[farmId]/panier`)
- Récapitulatif des produits
- Choix retrait/livraison (style Drive)
- Bouton "Commander"

### 5️⃣ Confirmation (`/shop/commande/[orderId]`)
- Message de succès
- Numéro de commande + code de retrait
- Actions : "Voir ma commande" / "Retour aux fermes"

### 6️⃣ Suivi commande (`/shop/ma-commande/[orderId]`)
- Statut visuel de la commande
- Rappel des produits
- Informations de contact

### 7️⃣ Dashboard producteur (`/dashboard/commandes`)
- Liste des commandes par statut
- Actions : Accepter, Refuser, Marquer prête, Remise effectuée

## 📂 Structure des fichiers

```
app/
├── shop/
│   ├── page.tsx                          # Liste des fermes
│   ├── [farmId]/
│   │   ├── page.tsx                      # Vitrine ferme
│   │   ├── boutique/
│   │   │   └── page.tsx                  # Boutique (tunnel fermé)
│   │   └── panier/
│   │       └── page.tsx                  # Panier
│   ├── commande/
│   │   └── [orderId]/
│   │       └── page.tsx                  # Confirmation
│   └── ma-commande/
│       └── [orderId]/
│           └── page.tsx                  # Suivi
├── dashboard/
│   └── commandes/
│       └── page.tsx                      # Dashboard producteur
lib/
├── store/
│   └── cartStore.ts                      # Store Zustand pour le panier
supabase/
└── migrations/
    └── 20250101_create_shop_tables.sql   # Migration SQL
```

## 🗄️ Base de données

### Tables créées

#### `products`
```sql
- id: BIGSERIAL PRIMARY KEY
- farm_id: BIGINT (FK vers listings)
- name: TEXT
- description: TEXT
- price: DECIMAL(10, 2)
- unit: TEXT (kg, pièce, douzaine, etc.)
- image_url: TEXT
- stock_status: TEXT (in_stock, low_stock, out_of_stock)
- active: BOOLEAN
- created_at, updated_at: TIMESTAMP
```

#### `orders`
```sql
- id: BIGSERIAL PRIMARY KEY
- user_id: TEXT
- farm_id: BIGINT (FK vers listings)
- delivery_mode: TEXT (pickup, delivery)
- delivery_day: TEXT
- total_price: DECIMAL(10, 2)
- status: TEXT (pending, confirmed, ready, delivered, cancelled)
- items: JSONB
- created_at, updated_at: TIMESTAMP
```

### Colonnes ajoutées à `listings`
- `delivery_available: BOOLEAN`
- `delivery_days: TEXT`
- `delivery_price: DECIMAL(10, 2)`
- `pickup_days: TEXT`

## 🚀 Déploiement

### 1. Appliquer la migration SQL

```bash
# Via Supabase Dashboard
# Allez dans SQL Editor et exécutez le fichier:
supabase/migrations/20250101_create_shop_tables.sql

# Ou via CLI
supabase db push
```

### 2. Ajouter des produits de test (optionnel)

```sql
INSERT INTO public.products (farm_id, name, description, price, unit, stock_status) VALUES
(1, 'Pommes de terre', 'Pommes de terre fraîches', 2.00, 'kg', 'in_stock'),
(1, 'Œufs plein air', 'Œufs frais', 4.50, 'douzaine', 'in_stock');
```

### 3. Tester le flow

1. Visitez `/shop`
2. Sélectionnez une ferme
3. Entrez dans la boutique
4. Ajoutez des produits au panier
5. Finalisez la commande
6. Vérifiez la confirmation
7. (En tant que producteur) Gérez la commande dans `/dashboard/commandes`

## 🎨 Design System

### Couleurs (depuis `lib/config/constants.ts`)
- `PRIMARY`: #16a34a (Vert)
- `SUCCESS`: #16a34a
- `WARNING`: #f59e0b
- `ERROR`: #dc2626

### Composants clés
- **Mini panier sticky** : Position fixe en bas, design type Deliveroo
- **Header boutique** : Sticky top avec rappel ferme
- **Badges** : Livraison, stock, statuts
- **Cards produits** : Contrôles +/- intégrés

## 📱 Responsive

- **Mobile** : Panier sticky, layout single-column
- **Tablet** : Grid 2 colonnes
- **Desktop** : Grid 3 colonnes, max-width conteneurs

## 🔒 Sécurité (RLS)

- Les utilisateurs voient uniquement leurs commandes
- Les producteurs gèrent uniquement leurs produits/commandes
- Les produits actifs sont visibles par tous

## 🎯 Prochaines étapes

1. ✅ Structure de base créée
2. ✅ Store panier implémenté
3. ✅ Flow complet UI/UX
4. ✅ Dashboard producteur
5. ⏳ Notifications email/SMS
6. ⏳ Système de paiement
7. ⏳ Gestion stock avancée
8. ⏳ Analytics producteur

## 💡 Philosophie UX

### Ce qui rend cette UX unique :

1. **Tunnel fermé** : Pas de confusion, on achète chez UNE ferme
2. **Familiarité** : Même logique mentale que Leclerc/Carrefour
3. **Pas de jargon** : Vocabulaire grand public
4. **Badges rassurants** : "Livraison locale" comme "Drive dispo"
5. **Codes de retrait** : Comme au fast-food
6. **Statuts visuels** : Emojis + couleurs

## 🐛 Dépannage

### Le panier ne se vide pas
```typescript
// Utilisez clearCart() du store
const clearCart = useCartStore((state) => state.clearCart);
clearCart();
```

### Erreur "Cannot add product from different farm"
C'est normal ! C'est la logique tunnel fermé. L'utilisateur doit vider son panier avant d'acheter chez une autre ferme.

### Tables non trouvées
Assurez-vous d'avoir exécuté la migration SQL :
```sql
supabase/migrations/20250101_create_shop_tables.sql
```

## 📚 Ressources

- Design inspiration : Deliveroo, Uber Eats, Leclerc Drive
- Store management : Zustand
- UI Components : Radix UI + Tailwind
- Icons : Lucide React

---

**Auteur** : Claude (Anthropic)
**Date** : 24 Décembre 2025
**Version** : 1.0.0
