// lib/types/database.ts
// Types générés pour la base de données Farm-to-Fork

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
          id: string;
          email: string;
          role: "user" | "farmer" | "admin";
          favorites: number[];
          created_at: string;
          updated_at: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          email: string;
          role?: "user" | "farmer" | "admin";
          favorites?: number[];
          created_at?: string;
          updated_at?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          user_id: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: "user" | "farmer" | "admin";
          favorites?: number[];
          created_at?: string;
          updated_at?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      listing: {
        Row: {
          id: number;
          name: string;
          address: string;
          lat: string;
          lng: string;
          availability: "open" | "closed" | null;
          product_type: string[] | null;
          certifications: string[] | null;
          purchase_mode: string[] | null;
          production_method: string[] | null;
          additional_services: string[] | null;
          rating: number | null;
          description: string | null;
          email: string | null;
          phoneNumber: string | null;
          website: string | null;
          active: boolean | null;
          created_at: string;
          modified_at: string | null;
          published_at: string | null;
          user_id: string | null;
          farm_name: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          address: string;
          lat: string;
          lng: string;
          availability?: "open" | "closed" | null;
          product_type?: string[] | null;
          certifications?: string[] | null;
          purchase_mode?: string[] | null;
          production_method?: string[] | null;
          additional_services?: string[] | null;
          rating?: number | null;
          description?: string | null;
          email?: string | null;
          phoneNumber?: string | null;
          website?: string | null;
          active?: boolean | null;
          created_at?: string;
          modified_at?: string | null;
          published_at?: string | null;
          user_id?: string | null;
          farm_name?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          address?: string;
          lat?: string;
          lng?: string;
          availability?: "open" | "closed" | null;
          product_type?: string[] | null;
          certifications?: string[] | null;
          purchase_mode?: string[] | null;
          production_method?: string[] | null;
          additional_services?: string[] | null;
          rating?: number | null;
          description?: string | null;
          email?: string | null;
          phoneNumber?: string | null;
          website?: string | null;
          active?: boolean | null;
          created_at?: string;
          modified_at?: string | null;
          published_at?: string | null;
          user_id?: string | null;
          farm_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "listing_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      listingImages: {
        Row: {
          id: number;
          listing_id: number;
          url: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          listing_id: number;
          url: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          listing_id?: number;
          url?: string;
          created_at?: string;
          updated_at?: string | null;
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
          user_id: string;
          email: string;
          farm_name: string;
          location: string;
          phone: string | null;
          website: string | null;
          description: string;
          products: string | null;
          status: "pending" | "approved" | "rejected";
          created_at: string;
          updated_at: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
        };
        Insert: {
          id?: number;
          user_id: string;
          email: string;
          farm_name: string;
          location: string;
          phone?: string | null;
          website?: string | null;
          description: string;
          products?: string | null;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
          updated_at?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string;
          email?: string;
          farm_name?: string;
          location?: string;
          phone?: string | null;
          website?: string | null;
          description?: string;
          products?: string | null;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
          updated_at?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "farmer_requests_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: number;
          name: string;
          category: string;
          type: string;
          labels: string[] | null;
          listing_id: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          category: string;
          type: string;
          labels?: string[] | null;
          listing_id: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          category?: string;
          type?: string;
          labels?: string[] | null;
          listing_id?: number;
          created_at?: string;
          updated_at?: string;
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
      favorites: {
        Row: {
          id: number;
          user_id: string;
          listing_id: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          listing_id: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          listing_id?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_listing_id_fkey";
            columns: ["listing_id"];
            referencedRelation: "listing";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: number;
          listing_id: number;
          user_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          listing_id: number;
          user_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          listing_id?: number;
          user_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey";
            columns: ["listing_id"];
            referencedRelation: "listing";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
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
      availability_status: "open" | "closed";
      farmer_request_status: "pending" | "approved" | "rejected";
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
export type Favorite = Database["public"]["Tables"]["favorites"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];

// Types pour les insertions (sans les champs auto-générés)
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ListingInsert = Database["public"]["Tables"]["listing"]["Insert"];
export type ListingImageInsert =
  Database["public"]["Tables"]["listingImages"]["Insert"];
export type FarmerRequestInsert =
  Database["public"]["Tables"]["farmer_requests"]["Insert"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type FavoriteInsert =
  Database["public"]["Tables"]["favorites"]["Insert"];
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];

// Types pour les mises à jour
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type ListingUpdate = Database["public"]["Tables"]["listing"]["Update"];
export type ListingImageUpdate =
  Database["public"]["Tables"]["listingImages"]["Update"];
export type FarmerRequestUpdate =
  Database["public"]["Tables"]["farmer_requests"]["Update"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
export type FavoriteUpdate =
  Database["public"]["Tables"]["favorites"]["Update"];
export type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];

// Types pour les énumérations
export type UserRole = Database["public"]["Enums"]["user_role"];
export type AvailabilityStatus =
  Database["public"]["Enums"]["availability_status"];
export type FarmerRequestStatus =
  Database["public"]["Enums"]["farmer_request_status"];
