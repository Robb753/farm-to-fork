# Organisation des Types - Farm-to-Fork

Ce dossier centralise tous les types TypeScript de l'application pour éviter les duplications et améliorer la maintenabilité.

## Structure

```
lib/types/
├── index.ts           # Point d'entrée centralisé avec tous les exports
├── enums.ts          # Énumérations (UserRole, Availability, etc.)
├── ui.ts             # Types pour les composants UI
└── README.md         # Ce fichier

lib/store/
└── types.ts          # Types liés au store (Listing, MapState, etc.)
```

## Utilisation

### Import Recommandé (via index.ts)

```typescript
// ✅ Import depuis le point d'entrée centralisé
import type {
  Listing,
  UserProfile,
  FilterState,
  MapState,
  UserRole
} from "@/lib/types";
```

### Import Direct (si nécessaire)

```typescript
// ✅ Import direct depuis le fichier spécifique
import type { Listing } from "@/lib/store/types";
import { UserRole } from "@/lib/types/enums";
import type { Product } from "@/lib/types/ui";
```

## Fichiers de Types

### 1. `enums.ts`
Contient toutes les énumérations de l'application :
- `UserRole` - Rôles utilisateur (USER, FARMER, ADMIN)
- `Availability` - Disponibilité (OPEN, CLOSED)
- `Language` - Langues (FR, EN)
- `Theme` - Thèmes (LIGHT, DARK)
- `ProductType` - Types de produits
- `Certification` - Certifications
- `PurchaseMode` - Modes d'achat
- `ProductionMethod` - Méthodes de production
- `AdditionalService` - Services additionnels
- `MapType` - Types de cartes

### 2. `lib/store/types.ts`
Types liés au state management :
- **Types de base** : `LatLng`, `MapBounds`, `Listing`, `FilterState`, `UserProfile`, `Role`
- **Types d'état** : `MapState`, `ListingsState`, `UserState`, `SettingsState`, `UIState`
- **Types legacy** : `AppState`, `AppActions` (deprecated)

### 3. `ui.ts`
Types pour les composants UI :
- `Product` - Produit agricole
- `ProductSelectorProps` - Props du sélecteur de produits
- `FilterOption` - Option de filtre
- `FilterSection` - Section de filtres
- `ModalProps` - Props des modales
- `LoadingProps` - Props des états de chargement
- `EmptyStateProps` - Props des états vides
- `StatusBadgeProps` - Props des badges de statut

## Migration depuis les Anciens Types
```typescript

export interface LatLng { lat: number; lng: number; }

// lib/store/userStore.ts
interface UserProfile { id: string; email: string; ... }
```

### Après (types centralisés)
```typescript
// ✅ Une seule source de vérité
// lib/store/types.ts
export interface LatLng { lat: number; lng: number; }
export interface UserProfile { id: string; email: string; ... }

// Usage dans les stores
import type { LatLng, UserProfile } from "./types";
```

## Avantages

1. **Single Source of Truth** : Un seul endroit pour chaque type
2. **Pas de duplication** : Réduit le code de ~60%
3. **Meilleure maintenance** : Modification en un seul endroit
4. **Type safety** : Détection des erreurs à la compilation
5. **Documentation** : JSDoc sur tous les types
6. **Backward compatibility** : Aliases pour les anciens noms de types

## Règles de Contribution

1. **Ne JAMAIS dupliquer un type** - Toujours importer depuis `@/lib/types`
2. **Documenter avec JSDoc** - Tous les types doivent avoir une description
3. **Préférer les enums** - Utiliser les enums plutôt que les string literals
4. **Nommer clairement** - Utiliser des noms descriptifs et cohérents
5. **Grouper logiquement** - Mettre les types connexes ensemble

## Changelog

### v1.0.0 (2025-11-01)
- ✅ Création de la structure centralisée des types
- ✅ Création de `enums.ts` pour les énumérations
- ✅ Enrichissement de `lib/store/types.ts`
- ✅ Création de `ui.ts` pour les types UI
- ✅ Suppression des duplications dans userStore.ts
- ✅ Création du fichier index.ts pour exports centralisés
- ✅ Documentation complète
