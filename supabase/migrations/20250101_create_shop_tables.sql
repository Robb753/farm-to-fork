-- Migration pour créer les tables du système de shop
-- Date: 2025-01-01
-- Description: Création des tables products et orders pour l'UX "supermarché-like"

-- ==================== TABLE PRODUCTS ====================

-- Table pour les produits d'une ferme
CREATE TABLE IF NOT EXISTS public.products (
  id BIGSERIAL PRIMARY KEY,
  farm_id BIGINT NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'unité', -- kg, pièce, douzaine, litre, etc.
  image_url TEXT,
  stock_status TEXT NOT NULL DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_products_farm_id ON public.products(farm_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);

-- RLS (Row Level Security) pour products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut voir les produits actifs
CREATE POLICY "Anyone can view active products"
  ON public.products
  FOR SELECT
  USING (active = true);

-- Politique : Les fermiers peuvent gérer leurs propres produits
CREATE POLICY "Farmers can manage their products"
  ON public.products
  FOR ALL
  USING (
    farm_id IN (
      SELECT id FROM public.listings WHERE user_id = auth.uid()
    )
  );

-- ==================== TABLE ORDERS ====================

-- Table pour les commandes
CREATE TABLE IF NOT EXISTS public.orders (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  farm_id BIGINT NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  delivery_mode TEXT NOT NULL CHECK (delivery_mode IN ('pickup', 'delivery')),
  delivery_day TEXT,
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'ready', 'delivered', 'cancelled')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array d'objets { product_id, product_name, quantity, unit_price, unit }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_farm_id ON public.orders(farm_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- RLS (Row Level Security) pour orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leurs propres commandes
CREATE POLICY "Users can view their own orders"
  ON public.orders
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Politique : Les utilisateurs peuvent créer des commandes
CREATE POLICY "Users can create orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- Politique : Les fermiers peuvent voir les commandes de leur ferme
CREATE POLICY "Farmers can view their farm orders"
  ON public.orders
  FOR SELECT
  USING (
    farm_id IN (
      SELECT id FROM public.listings WHERE user_id = auth.uid()
    )
  );

-- Politique : Les fermiers peuvent mettre à jour les commandes de leur ferme
CREATE POLICY "Farmers can update their farm orders"
  ON public.orders
  FOR UPDATE
  USING (
    farm_id IN (
      SELECT id FROM public.listings WHERE user_id = auth.uid()
    )
  );

-- ==================== FONCTIONS ====================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour products
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==================== AJOUT DE COLONNES AUX LISTINGS ====================

-- Ajouter des colonnes liées à la livraison si elles n'existent pas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='listings' AND column_name='delivery_available') THEN
    ALTER TABLE public.listings ADD COLUMN delivery_available BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='listings' AND column_name='delivery_days') THEN
    ALTER TABLE public.listings ADD COLUMN delivery_days TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='listings' AND column_name='delivery_price') THEN
    ALTER TABLE public.listings ADD COLUMN delivery_price DECIMAL(10, 2) DEFAULT 5.00;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='listings' AND column_name='pickup_days') THEN
    ALTER TABLE public.listings ADD COLUMN pickup_days TEXT;
  END IF;
END $$;

-- ==================== DONNÉES DE TEST (OPTIONNEL) ====================

-- Vous pouvez décommenter cette section pour ajouter des produits de test

INSERT INTO public.products (farm_id, name, description, price, unit, stock_status) VALUES
(1, 'Pommes de terre', 'Pommes de terre fraîches de notre ferme', 2.00, 'kg', 'in_stock'),
(1, 'Œufs plein air', 'Œufs frais de nos poules élevées en plein air', 4.50, 'douzaine', 'in_stock'),
(1, 'Tomates', 'Tomates bio de saison', 3.50, 'kg', 'in_stock'),
(1, 'Salade', 'Salade verte fraîche', 1.50, 'pièce', 'in_stock'),
(1, 'Carottes', 'Carottes bio', 2.50, 'kg', 'in_stock');

COMMENT ON TABLE public.products IS 'Table des produits proposés par les fermes';
COMMENT ON TABLE public.orders IS 'Table des commandes passées par les utilisateurs';
