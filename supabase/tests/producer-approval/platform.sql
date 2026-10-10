-- LOCAL TEST ONLY: minimal Supabase SQL boundary. Not GoTrue, PostgREST or Storage HTTP.

CREATE ROLE anon NOLOGIN;

CREATE ROLE authenticated NOLOGIN;

CREATE ROLE service_role NOLOGIN BYPASSRLS;

CREATE SCHEMA auth;

CREATE SCHEMA storage;

CREATE TYPE storage.buckettype AS ENUM ('STANDARD','ANALYTICS','VECTOR');

CREATE OR REPLACE FUNCTION auth.jwt()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$function$;

CREATE OR REPLACE FUNCTION auth.uid()
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$function$;

CREATE TABLE storage.buckets (
  "allowed_mime_types" text[],
  "avif_autodetection" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "file_size_limit" bigint,
  "id" text NOT NULL,
  "name" text NOT NULL,
  "owner" uuid,
  "owner_id" text,
  "public" boolean DEFAULT false,
  "type" storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now(),
  "versioning_status" text DEFAULT 'DISABLED'::text NOT NULL
);

CREATE TABLE storage.objects (
  "archived_at" timestamp with time zone,
  "bucket_id" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "is_delete_marker" boolean DEFAULT false NOT NULL,
  "is_versioned" boolean DEFAULT false NOT NULL,
  "last_accessed_at" timestamp with time zone DEFAULT now(),
  "metadata" jsonb,
  "name" text,
  "owner" uuid,
  "owner_id" text,
  "path_tokens" text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
  "updated_at" timestamp with time zone DEFAULT now(),
  "user_metadata" jsonb,
  "version" text
);

ALTER TABLE storage.buckets ADD PRIMARY KEY (id);

ALTER TABLE storage.objects ADD PRIMARY KEY (id);

ALTER TABLE storage.objects ADD UNIQUE (bucket_id,name);

ALTER TABLE storage.objects ADD FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public,auth,storage TO anon,authenticated,service_role;

GRANT ALL ON storage.objects,storage.buckets TO anon,authenticated,service_role;
