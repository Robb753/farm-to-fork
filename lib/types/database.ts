// lib/types/database.ts
// Types pour la base de données Farm-to-Fork (schéma Supabase) — aligné avec tes tables + ajout orders

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
          favorites: Json | null; // jsonb
          updated_at: string;
        };
        Insert: {
          id?: number;
          created_at?: string;
          user_id: string;
          email: string;
          role?: "user" | "farmer" | "admin";
          farm_id?: number | null;
          favorites?: Json | null;
          updated_at?: string;
        };
        Update: {
          id?: number;
          created_at?: string;
          user_id?: string;
          email?: string;
          role?: "user" | "farmer" | "admin";
          farm_id?: number | null;
          favorites?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };

      listing: {
        Row: {
          id: number;
          created_at: string;

          coordinates: Json | null;

          // SQL: "createdBy" text null + unique
          createdBy: string | null;

          active: boolean | null;

          typeferme: string | null;

          phoneNumber: string | null;
          email: string | null;
          website: string | null;

          // SQL: enum arrays
          certifications:
            | Database["public"]["Enums"]["certification_enum"][]
            | null;

          description: string | null;
          name: string | null;

          profileImage: string | null;
          fullName: string | null;

          product_type:
            | Database["public"]["Enums"]["product_type_enum"][]
            | null;
          purchase_mode:
            | Database["public"]["Enums"]["purchase_mode_enum"][]
            | null;
          production_method:
            | Database["public"]["Enums"]["production_method_enum"][]
            | null;
          availability:
            | Database["public"]["Enums"]["availability_enum"][]
            | null;
          additional_services:
            | Database["public"]["Enums"]["additional_services_enum"][]
            | null;

          address: string | null;

          updated_at: string | null;

          // SQL: nullable + check (both null OR both not null)
          lat: number | null;
          lng: number | null;

          published_at: string | null;
          modified_at: string | null;

          opening_hours: Json | null;
          pickup_days: string | null;

          // SQL: NOT NULL DEFAULT false
          delivery_available: boolean;

          founded_year: string | null;

          // SQL: NOT NULL DEFAULT false
          orders_enabled: boolean;

          // SQL: text null + unique index where not null
          clerk_user_id: string | null;
        };

        Insert: {
          id?: number;
          created_at?: string;

          coordinates?: Json | null;

          createdBy?: string | null;
          active?: boolean | null;

          typeferme?: string | null;

          phoneNumber?: string | null;
          email?: string | null;
          website?: string | null;

          certifications?:
            | Database["public"]["Enums"]["certification_enum"][]
            | null;

          description?: string | null;
          name?: string | null;

          profileImage?: string | null;
          fullName?: string | null;

          product_type?:
            | Database["public"]["Enums"]["product_type_enum"][]
            | null;
          purchase_mode?:
            | Database["public"]["Enums"]["purchase_mode_enum"][]
            | null;
          production_method?:
            | Database["public"]["Enums"]["production_method_enum"][]
            | null;
          availability?:
            | Database["public"]["Enums"]["availability_enum"][]
            | null;
          additional_services?:
            | Database["public"]["Enums"]["additional_services_enum"][]
            | null;

          address?: string | null;

          updated_at?: string | null;

          lat?: number | null;
          lng?: number | null;

          published_at?: string | null;
          modified_at?: string | null;

          opening_hours?: Json | null;
          pickup_days?: string | null;

          delivery_available?: boolean;
          founded_year?: string | null;
          orders_enabled?: boolean;

          clerk_user_id?: string | null;
        };

        Update: {
          id?: number;
          created_at?: string;

          coordinates?: Json | null;

          createdBy?: string | null;
          active?: boolean | null;

          typeferme?: string | null;

          phoneNumber?: string | null;
          email?: string | null;
          website?: string | null;

          certifications?:
            | Database["public"]["Enums"]["certification_enum"][]
            | null;

          description?: string | null;
          name?: string | null;

          profileImage?: string | null;
          fullName?: string | null;

          product_type?:
            | Database["public"]["Enums"]["product_type_enum"][]
            | null;
          purchase_mode?:
            | Database["public"]["Enums"]["purchase_mode_enum"][]
            | null;
          production_method?:
            | Database["public"]["Enums"]["production_method_enum"][]
            | null;
          availability?:
            | Database["public"]["Enums"]["availability_enum"][]
            | null;
          additional_services?:
            | Database["public"]["Enums"]["additional_services_enum"][]
            | null;

          address?: string | null;

          updated_at?: string | null;

          lat?: number | null;
          lng?: number | null;

          published_at?: string | null;
          modified_at?: string | null;

          opening_hours?: Json | null;
          pickup_days?: string | null;

          delivery_available?: boolean;
          founded_year?: string | null;
          orders_enabled?: boolean;

          clerk_user_id?: string | null;
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
          updated_at: string;
          user_id: string;
          email: string;

          // ✅ Informations personnelles
          first_name: string;
          last_name: string;
          phone: string | null;

          // ✅ Informations entreprise
          siret: string;

          // ✅ Informations ferme
          farm_name: string;
          location: string;
          description: string | null;
          products: string | null;
          website: string | null;

          // ✅ Coordonnées GPS (AJOUTÉES)
          lat: number | null;
          lng: number | null;

          // ✅ Workflow
          status: string;
          approved_by_admin_at: string | null;
          validated_by: string | null;
          admin_reason: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          email: string;

          // ✅ Informations personnelles
          first_name: string;
          last_name: string;
          phone?: string | null;

          // ✅ Informations entreprise
          siret: string;

          // ✅ Informations ferme
          farm_name: string;
          location: string;
          description?: string | null;
          products?: string | null;
          website?: string | null;

          // ✅ Coordonnées GPS (AJOUTÉES)
          lat?: number | null;
          lng?: number | null;

          // ✅ Workflow
          status?: string;
          approved_by_admin_at?: string | null;
          validated_by?: string | null;
          admin_reason?: string | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          email?: string;

          // ✅ Informations personnelles
          first_name?: string;
          last_name?: string;
          phone?: string | null;

          // ✅ Informations entreprise
          siret?: string;

          // ✅ Informations ferme
          farm_name?: string;
          location?: string;
          description?: string | null;
          products?: string | null;
          website?: string | null;

          // ✅ Coordonnées GPS (AJOUTÉES)
          lat?: number | null;
          lng?: number | null;

          // ✅ Workflow
          status?: string;
          approved_by_admin_at?: string | null;
          validated_by?: string | null;
          admin_reason?: string | null;
        };
        Relationships: [];
      };

      products: {
        Row: {
          id: number; // bigint
          listing_id: number | null; // bigint null
          farm_id: number | null; // bigint null

          name: string;
          description: string | null;

          price: number | null; // numeric(10,2) (voir note)
          unit: string | null;

          available: boolean | null;

          created_at: string;
          updated_at: string | null;

          labels: string[] | null; // text[]
          stock_quantity: number; // int not null default 0
          min_stock: number; // int not null default 5

          sku: string | null; // varchar(50)
          category: string | null; // varchar(100)

          image_url: string | null;

          seasonal: boolean; // default false
          season_start: string | null; // date
          season_end: string | null; // date

          is_published: boolean; // default true
          active: boolean; // default true

          stock_status: "in_stock" | "low_stock" | "out_of_stock";
        };

        Insert: {
          id?: number;

          listing_id?: number | null;
          farm_id?: number | null;

          name: string;
          description?: string | null;

          price?: number | null;
          unit?: string | null;

          available?: boolean | null;

          created_at?: string;
          updated_at?: string | null;

          labels?: string[] | null;
          stock_quantity?: number; // default 0
          min_stock?: number; // default 5

          sku?: string | null;
          category?: string | null;

          image_url?: string | null;

          seasonal?: boolean;
          season_start?: string | null;
          season_end?: string | null;

          is_published?: boolean;
          active?: boolean;

          stock_status?: "in_stock" | "low_stock" | "out_of_stock";
        };

        Update: {
          id?: number;

          listing_id?: number | null;
          farm_id?: number | null;

          name?: string;
          description?: string | null;

          price?: number | null;
          unit?: string | null;

          available?: boolean | null;

          created_at?: string;
          updated_at?: string | null;

          labels?: string[] | null;
          stock_quantity?: number;
          min_stock?: number;

          sku?: string | null;
          category?: string | null;

          image_url?: string | null;

          seasonal?: boolean;
          season_start?: string | null;
          season_end?: string | null;

          is_published?: boolean;
          active?: boolean;

          stock_status?: "in_stock" | "low_stock" | "out_of_stock";
        };

        Relationships: [
          {
            foreignKeyName: "products_farm_id_fkey";
            columns: ["farm_id"];
            referencedRelation: "listing";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_listing_id_fkey";
            columns: ["listing_id"];
            referencedRelation: "listing";
            referencedColumns: ["id"];
          },
        ];
      };

      orders: {
        Row: {
          id: number;
          user_id: string; // ✅ TEXT = Clerk sub
          farm_id: number;

          delivery_mode: "pickup" | "delivery";
          delivery_day: string | null;

          total_price: number; // ⚠️ numeric(10,2) => souvent string côté supabase-js, voir note plus bas
          status: "pending" | "confirmed" | "ready" | "delivered" | "cancelled";

          items: Json; // jsonb

          created_at: string;
          updated_at: string;

          payment_status: "unpaid" | "paid" | "refunded" | null;

          delivery_address: Json | null;

          customer_notes: string | null;
          farmer_notes: string | null;

          cancelled_reason: string | null;
          cancelled_by: "customer" | "farmer" | "admin" | null;

          metadata: Json | null;
        };

        Insert: {
          id?: number;
          user_id: string; // ✅ TEXT = Clerk sub
          farm_id: number;

          delivery_mode: "pickup" | "delivery";
          delivery_day?: string | null;

          total_price?: number;
          status?:
            | "pending"
            | "confirmed"
            | "ready"
            | "delivered"
            | "cancelled";

          items?: Json;

          created_at?: string;
          updated_at?: string;

          payment_status?: "unpaid" | "paid" | "refunded" | null;

          delivery_address?: Json | null;

          customer_notes?: string | null;
          farmer_notes?: string | null;

          cancelled_reason?: string | null;
          cancelled_by?: "customer" | "farmer" | "admin" | null;

          metadata?: Json | null;
        };

        Update: {
          id?: number;
          user_id?: string;
          farm_id?: number;

          delivery_mode?: "pickup" | "delivery";
          delivery_day?: string | null;

          total_price?: number;
          status?:
            | "pending"
            | "confirmed"
            | "ready"
            | "delivered"
            | "cancelled";

          items?: Json;

          created_at?: string;
          updated_at?: string;

          payment_status?: "unpaid" | "paid" | "refunded" | null;

          delivery_address?: Json | null;

          customer_notes?: string | null;
          farmer_notes?: string | null;

          cancelled_reason?: string | null;
          cancelled_by?: "customer" | "farmer" | "admin" | null;

          metadata?: Json | null;
        };

        Relationships: [
          {
            foreignKeyName: "orders_farm_id_fkey";
            columns: ["farm_id"];
            referencedRelation: "listing";
            referencedColumns: ["id"];
          },
        ];
      };

      reviews: {
        Row: {
          id: number;
          listing_id: number;
          user_id: string | null;
          rating: number;
          title: string | null;
          comment: string;
          reviewer_name: string | null;
          reviewer_email: string | null;
          is_verified: boolean;
          visit_type: string | null;
          purchased_products: Json | null;
          visit_date: string | null;
          helpful_count: number;
          not_helpful_count: number;
          reported_count: number;
          status: string;
          moderated_by: string | null;
          moderated_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
          ip_address: string | null;
          user_agent: string | null;
          source: string;
        };
        Insert: {
          id?: number;
          listing_id: number;
          user_id?: string | null;
          rating: number;
          title?: string | null;
          comment: string;
          reviewer_name?: string | null;
          reviewer_email?: string | null;
          is_verified?: boolean;
          visit_type?: string | null;
          purchased_products?: Json | null;
          visit_date?: string | null;
          helpful_count?: number;
          not_helpful_count?: number;
          reported_count?: number;
          status?: string;
          moderated_by?: string | null;
          moderated_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          source?: string;
        };
        Update: {
          id?: number;
          listing_id?: number;
          user_id?: string | null;
          rating?: number;
          title?: string | null;
          comment?: string;
          reviewer_name?: string | null;
          reviewer_email?: string | null;
          is_verified?: boolean;
          visit_type?: string | null;
          purchased_products?: Json | null;
          visit_date?: string | null;
          helpful_count?: number;
          not_helpful_count?: number;
          reported_count?: number;
          status?: string;
          moderated_by?: string | null;
          moderated_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          source?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey";
            columns: ["listing_id"];
            referencedRelation: "listing";
            referencedColumns: ["id"];
          },
        ];
      };

      review_votes: {
        Row: {
          id: number;
          review_id: number;
          user_id: string;
          vote_type: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          review_id: number;
          user_id: string;
          vote_type: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          review_id?: number;
          user_id?: string;
          vote_type?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_votes_review_id_fkey";
            columns: ["review_id"];
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
        ];
      };

      review_reports: {
        Row: {
          id: number;
          review_id: number;
          reporter_user_id: string;
          reason: string;
          description: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          review_id: number;
          reporter_user_id: string;
          reason: string;
          description?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          review_id?: number;
          reporter_user_id?: string;
          reason?: string;
          description?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_reports_review_id_fkey";
            columns: ["review_id"];
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
        ];
      };
    };

    Views: {
      [_ in never]: never;
    };
    Functions: {
      debug_auth_jwt: {
        Args: Record<string, never>;
        Returns: any;
      };
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

// Helpers
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Listing = Database["public"]["Tables"]["listing"]["Row"];
export type ListingImage = Database["public"]["Tables"]["listingImages"]["Row"];
export type FarmerRequest =
  Database["public"]["Tables"]["farmer_requests"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewVote = Database["public"]["Tables"]["review_votes"]["Row"];
export type ReviewReport =
  Database["public"]["Tables"]["review_reports"]["Row"];

// Inserts
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ListingInsert = Database["public"]["Tables"]["listing"]["Insert"];
export type ListingImageInsert =
  Database["public"]["Tables"]["listingImages"]["Insert"];
export type FarmerRequestInsert =
  Database["public"]["Tables"]["farmer_requests"]["Insert"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
export type ReviewVoteInsert =
  Database["public"]["Tables"]["review_votes"]["Insert"];
export type ReviewReportInsert =
  Database["public"]["Tables"]["review_reports"]["Insert"];

// Updates
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type ListingUpdate = Database["public"]["Tables"]["listing"]["Update"];
export type ListingImageUpdate =
  Database["public"]["Tables"]["listingImages"]["Update"];
export type FarmerRequestUpdate =
  Database["public"]["Tables"]["farmer_requests"]["Update"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
export type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];
export type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];
export type ReviewVoteUpdate =
  Database["public"]["Tables"]["review_votes"]["Update"];
export type ReviewReportUpdate =
  Database["public"]["Tables"]["review_reports"]["Update"];

// Enum helpers
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
