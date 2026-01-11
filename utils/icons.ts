// utils/icons.ts
// Fichier barrel pour optimiser les imports Lucide React avec types TypeScript

/**
 * Barrel export pour les icônes Lucide React
 * 
 * Features:
 * - Tree-shaking optimisé avec exports nommés
 * - Organisation logique par catégories fonctionnelles
 * - Types TypeScript complets pour chaque icône
 * - Point d'entrée centralisé pour toutes les icônes
 * - Performance améliorée (évite les imports multiples)
 * 
 * Usage:
 * ```typescript
 * import { Search, MapPin, User } from "@/utils/icons";
 * ```
 */

export type {
  LucideIcon,
  LucideProps,
} from "lucide-react";

export {
  // ==================== NAVIGATION & UI ====================
  /** Icone de recherche */
  Search,
  /** Menu hamburger */
  Menu,
  /** Croix de fermeture */
  X,
  Shield,
  Copy,
  ShoppingBag,
  ShoppingCart,
  Navigation,
  AlertCircle,
  Factory,
  ExternalLink,
  Apple,
  Carrot,
  Milk,
  Egg,
  Flower,
  Package,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Euro,
  Info,
  Gift,
  BookOpen,
  Utensils,
  Sprout,
  CheckCircle2,
  /** Chevron vers le bas */
  ChevronDown,
  /** Chevron vers le haut */
  ChevronUp,
  /** Chevron vers la droite */
  ChevronRight,
  /** Chevron vers la gauche */
  ChevronLeft,
  /** Flèche vers la gauche */
  ArrowLeft,
  /** Flèche vers la droite */
  ArrowRight,
  /** Croix dans un cercle */
  XCircle,
  /** Boîte de réception */
  Inbox,

  // ==================== CARTES & LOCALISATION ====================
  /** Pin de localisation */
  MapPin,
  /** Pin de localisation épinglé */
  MapPinned,
  /** Étoile */
  Star,

  // ==================== UTILISATEUR & AUTHENTIFICATION ====================
  /** Utilisateur */
  User,
  /** Connexion */
  LogIn,
  /** Cœur (favoris) */
  Heart,
  /** Partage v2 */
  Share2,

  // ==================== ACTIONS ====================
  /** Plus */
  Plus,
  /** Plus dans un cercle */
  PlusCircle,
  /** Sauvegarder */
  Save,
  /** Envoyer */
  Send,
  /** Partager */
  Share,
  /** Œil (voir) */
  Eye,
  /** Corbeille */
  Trash2,
  /** Actualiser */
  RefreshCw,
  /** Appareil photo */
  Camera,
  /** Tracteur (agriculture) */
  TractorIcon,
  /** Éditer */
  Edit,

  // ==================== STATUT & FEEDBACK ====================
  /** Loader animé */
  Loader2,
  /** Check dans un cercle */
  CheckCircle,
  /** Triangle d'alerte */
  AlertTriangle,
  /** Coche de validation */
  Check,

  // ==================== LAYOUT ====================
  /** Vue en liste */
  List,
  /** Vue en grille */
  Grid,
  /** Maximiser */
  Maximize2,
  /** Minimiser */
  Minimize2,
  /** Filtre */
  Filter,

  // ==================== BUSINESS & AGRICULTURE ====================
  /** Bâtiment */
  Building2,
  /** Blé (agriculture) */
  Wheat,
  /** Panier de courses */
  ShoppingBasket,
  /** Calendrier */
  Calendar,
  /** Calendrier avec coche */
  CalendarCheck,
  /** Horloge */
  Clock,

  // ==================== COMMUNICATION ====================
  /** Téléphone */
  Phone,
  /** Email */
  Mail,
  /** Bulle de message */
  MessageCircle,
  /** Cercle */
  Circle,
  /** Curseurs horizontaux */
  SlidersHorizontal,

  // ==================== CONTENU ====================
  /** Image */
  Image,
  /** Fichier texte */
  FileText,
  /** Télécharger */
  Download,
  /** Uploader */
  Upload,

  // ==================== RÉSEAUX SOCIAUX ====================
  /** Instagram */
  Instagram,
  /** LinkedIn */
  Linkedin,
  /** Twitter/X */
  Twitter,

  // ==================== DIVERS ====================
  /** Globe terrestre */
  Globe,
  /** Maison */
  Home,
  /** Camion (livraison) */
  Truck,
  /** Récompense */
  Award,
  /** Feuille (écologie) */
  Leaf,
  /** Cible */
  Target,
  /** Poignée de main */
  Handshake,
  /** Fantôme */
  Ghost,
  /** Zoom avant */
  ZoomIn,

  // ==================== GRAPHIQUES & ANALYTICS ====================
  /** Graphique en barres */
  BarChart,
  /** Tendance croissante */
  TrendingUp,
  /** Activité */
  Activity,

  // ==================== PARAMÈTRES ====================
  /** Paramètres */
  Settings,
  /** Utilisateurs */
  Users,
  /** Liste avec coches */
  ListChecks,
} from "lucide-react";

/**
 * Constantes pour les tailles d'icônes couramment utilisées
 */
export const ICON_SIZES = {
  /** Très petite icône (12px) */
  XS: 12,
  /** Petite icône (16px) */
  SM: 16,
  /** Icône moyenne (20px) */
  MD: 20,
  /** Grande icône (24px) */
  LG: 24,
  /** Très grande icône (32px) */
  XL: 32,
  /** Icône extra large (48px) */
  XXL: 48,
} as const;

/**
 * Type pour les tailles d'icônes
 */
export type IconSize = typeof ICON_SIZES[keyof typeof ICON_SIZES];

/**
 * Props par défaut pour les icônes de l'application
 */
export const DEFAULT_ICON_PROPS = {
  size: ICON_SIZES.MD,
  strokeWidth: 2,
} as const;

/**
 * Helper pour créer des props d'icône cohérentes
 */
export const createIconProps = (
  size: IconSize = ICON_SIZES.MD,
  className?: string,
  strokeWidth: number = 2
) => ({
  size,
  className,
  strokeWidth,
});