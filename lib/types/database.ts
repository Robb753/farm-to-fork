// lib/types/database.ts
// Types générés pour la base de données Farm-to-Fork (schéma réel Supabase)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: number;
          created_at: string;
          user_id: string;
          email: string;
          role: "user" | "farmer" | "admin";
          farm_id: number | null;
          favorites: string; // Type text dans Supabase
          updated_at: string;
        };
        Insert: {
          id?: number;
          created_at?: string;
          user_id: string;
          email: string;
          role?: "user" | "farmer" | "admin";
          farm_id?: number | null;
          favorites?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          created_at?: string;
          user_id?: string;
          email?: string;
          role?: "user" | "farmer" | "admin";
          farm_id?: number | null;
          favorites?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      listing: {
        Row: {
          id: number;
          created_at: string;
          coordinates: Json | null; // Type json dans Supabase
          createdBy: string;
          active: boolean;
          typeferme: string | null;
          phoneNumber: string | null;
          email: string | null;
          website: string | null;
          certifications: string | null; // Type certification_enum
          description: string | null;
          name: string;
          profileImage: string | null;
          fullName: string | null;
          product_type: string | null; // Type product_type_enum
          purchase_mode: string | null; // Type purchase_mode_enum
          production_method: string | null; // Type production_method_enum
          availability: string | null; // Type availability_enum
          additional_services: string | null; // Type additional_services_enum
          address: string;
          updated_at: string | null;
          lat: number; // Type float8
          lng: number; // Type float8
        };
        Insert: {
          id?: number;
          created_at?: string;
          coordinates?: Json | null;
          createdBy: string;
          active?: boolean;
          typeferme?: string | null;
          phoneNumber?: string | null;
          email?: string | null;
          website?: string | null;
          certifications?: string | null;
          description?: string | null;
          name: string;
          profileImage?: string | null;
          fullName?: string | null;
          product_type?: string | null;
          purchase_mode?: string | null;
          production_method?: string | null;
          availability?: string | null;
          additional_services?: string | null;
          address: string;
          updated_at?: string | null;
          lat: number;
          lng: number;
        };
        Update: {
          id?: number;
          created_at?: string;
          coordinates?: Json | null;
          createdBy?: string;
          active?: boolean;
          typeferme?: string | null;
          phoneNumber?: string | null;
          email?: string | null;
          website?: string | null;
          certifications?: string | null;
          description?: string | null;
          name?: string;
          profileImage?: string | null;
          fullName?: string | null;
          product_type?: string | null;
          purchase_mode?: string | null;
          production_method?: string | null;
          availability?: string | null;
          additional_services?: string | null;
          address?: string;
          updated_at?: string | null;
          lat?: number;
          lng?: number;
        };
        Relationships: [];
      };
      listingImages: {
        Row: {
          id: number;
          created_at: string;
          url: string;
          listing_id: number;
        };
        Insert: {
          id?: number;
          created_at?: string;
          url: string;
          listing_id: number;
        };
        Update: {
          id?: number;
          created_at?: string;
          url?: string;
          listing_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "listingImages_listing_id_fkey";
            columns: ["listing_id"];
            referencedRelation: "listing";
            referencedColumns: ["id"];
          },
        ];
      };
      farmer_requests: {
        Row: {
          id: number;
          created_at: string;
          user_id: string;
          email: string;
          farm_name: string;
          location: string;
          phone: string | null;
          description: string;
          products: string | null;
          website: string | null;
          status: string; // Type varchar
        };
        Insert: {
          id?: number;
          created_at?: string;
          user_id: string;
          email: string;
          farm_name: string;
          location: string;
          phone?: string | null;
          description: string;
          products?: string | null;
          website?: string | null;
          status?: string;
        };
        Update: {
          id?: number;
          created_at?: string;
          user_id?: string;
          email?: string;
          farm_name?: string;
          location?: string;
          phone?: string | null;
          description?: string;
          products?: string | null;
          website?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: number;
          listing_id: number;
          name: string;
          description: string | null;
          price: number | null;
          unit: string | null;
          available: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          listing_id: number;
          name: string;
          description?: string | null;
          price?: number | null;
          unit?: string | null;
          available?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          listing_id?: number;
          name?: string;
          description?: string | null;
          price?: number | null;
          unit?: string | null;
          available?: boolean | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_listing_id_fkey";
            columns: ["listing_id"];
            referencedRelation: "listing";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: "user" | "farmer" | "admin";
      availability_enum: "open" | "closed" | "by_appointment";
      certification_enum: "bio" | "label_rouge" | "aoc" | "local";
      product_type_enum:
        | "fruits"
        | "legumes"
        | "produits_laitiers"
        | "viande"
        | "cereales";
      purchase_mode_enum: "direct" | "market" | "delivery" | "pickup";
      production_method_enum: "organic" | "conventional" | "sustainable";
      additional_services_enum:
        | "farm_visits"
        | "workshops"
        | "tasting"
        | "delivery";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Types helpers pour faciliter l'usage
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Listing = Database["public"]["Tables"]["listing"]["Row"];
export type ListingImage = Database["public"]["Tables"]["listingImages"]["Row"];
export type FarmerRequest =
  Database["public"]["Tables"]["farmer_requests"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];

// Types pour les insertions (sans les champs auto-générés)
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ListingInsert = Database["public"]["Tables"]["listing"]["Insert"];
export type ListingImageInsert =
  Database["public"]["Tables"]["listingImages"]["Insert"];
export type FarmerRequestInsert =
  Database["public"]["Tables"]["farmer_requests"]["Insert"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

// Types pour les mises à jour
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type ListingUpdate = Database["public"]["Tables"]["listing"]["Update"];
export type ListingImageUpdate =
  Database["public"]["Tables"]["listingImages"]["Update"];
export type FarmerRequestUpdate =
  Database["public"]["Tables"]["farmer_requests"]["Update"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

// Types pour les énumérations
export type UserRole = Database["public"]["Enums"]["user_role"];
export type AvailabilityStatus =
  Database["public"]["Enums"]["availability_enum"];
export type Certification = Database["public"]["Enums"]["certification_enum"];
export type ProductType = Database["public"]["Enums"]["product_type_enum"];
export type PurchaseMode = Database["public"]["Enums"]["purchase_mode_enum"];
export type ProductionMethod =
  Database["public"]["Enums"]["production_method_enum"];
export type AdditionalService =
  Database["public"]["Enums"]["additional_services_enum"];
