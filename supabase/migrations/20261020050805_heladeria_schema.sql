/*
# Heladería - Esquema completo de base de datos

## Descripción general
Crea el esquema completo para administrar una heladería pequeña: catálogo de productos
con variantes y toppings, ventas (transacciones) con sus artículos, clientes, pedidos
especiales con abonos, e inventario con recetas e inmovimientos.

Aplicación single-tenant SIN autenticación (no hay pantalla de login). Todas las políticas
permiten acceso anon+authenticated porque los datos son compartidos/intencionalmente públicos
para el negocio único que opera el sistema.

## 1. Tablas nuevas

### categories
Categorías de productos (Helados, Malteadas, Adicionales, Otros).
- id (uuid pk)
- name (text, not null, unique)
- display_order (int, default 0)
- icon (text, opcional - nombre de icono lucide)
- created_at (timestamptz)

### products
Productos del catálogo. Cada producto pertenece a una categoría.
- id (uuid pk)
- category_id (uuid fk -> categories)
- name (text, not null)
- description (text)
- image_url (text)
- base_price (numeric(12,0), not null) -- precios en COP sin decimales
- cost (numeric(12,0), opcional) -- costo estimado para margen
- is_active (boolean, default true)
- has_variants (boolean, default false) -- si requiere selección de variante
- badge (text) -- "Más vendido", "Nuevo", etc.
- display_order (int, default 0)
- is_demo (boolean, default true) -- marca datos de demostración
- created_at, updated_at (timestamptz)

### product_variants
Variantes/tamaños de un producto (ej: pequeño/mediano/grande) con precio propio.
- id (uuid pk)
- product_id (uuid fk -> products cascade)
- name (text, not null) -- "Pequeño", "Mediano", "Grande"
- price (numeric(12,0), not null)
- display_order (int, default 0)

### toppings
Adicionales opcionales que se pueden agregar a cualquier producto.
- id (uuid pk)
- name (text, not null)
- price (numeric(12,0), not null)
- is_active (boolean, default true)

### sales
Transacciones de venta confirmadas en el mostrador.
- id (uuid pk)
- total (numeric(12,0), not null)
- payment_method (text, not null) -- efectivo, transferencia, tarjeta, otro
- amount_received (numeric(12,0), opcional) -- para efectivo
- change (numeric(12,0), opcional) -- vueltas
- customer_id (uuid fk -> customers, opcional)
- notes (text)
- created_at (timestamptz, default now())

### sale_items
Artículos de cada venta.
- id (uuid pk)
- sale_id (uuid fk -> sales cascade)
- product_id (uuid fk -> products) -- set null on delete para historial
- product_name (text, not null) -- snapshot del nombre al vender
- variant_name (text) -- snapshot
- unit_price (numeric(12,0), not null) -- precio cobrado
- cost (numeric(12,0)) -- costo snapshot para margen
- quantity (int, not null, check >= 1)
- subtotal (numeric(12,0), not null)
- toppings_names (text[]) -- nombres de toppings seleccionados

### customers
Clientes opcionales.
- id (uuid pk)
- name (text, not null)
- phone (text)
- notes (text)
- created_at (timestamptz)

### orders
Pedidos especiales/anticipados, distintos de las ventas de mostrador.
- id (uuid pk)
- order_number (int, secuencia propia)
- customer_id (uuid fk -> customers, opcional)
- delivery_date (timestamptz)
- total (numeric(12,0), not null)
- deposit (numeric(12,0), default 0) -- abono recibido
- status (text, default 'pendiente') -- pendiente, en_preparacion, listo, entregado, cancelado
- items_summary (text) -- descripción de productos del pedido
- notes (text)
- settled (boolean, default false) -- si ya se liquidó como venta
- sale_id (uuid fk -> sales, opcional) -- venta generada al liquidar
- created_at (timestamptz)

### inventory_items
Items de inventario (ingredientes o productos).
- id (uuid pk)
- name (text, not null)
- unit (text, not null) -- "ml", "g", "unidad"
- quantity (numeric(14,2), default 0)
- low_stock_threshold (numeric(14,2), default 0)
- cost_per_unit (numeric(12,2), opcional)
- created_at, updated_at (timestamptz)

### recipe_items
Recetas: qué ingredientes consume un producto y en qué cantidad por unidad vendida.
- id (uuid pk)
- product_id (uuid fk -> products cascade)
- inventory_item_id (uuid fk -> inventory_items cascade)
- quantity (numeric(14,2), not null) -- cantidad consumida por unidad

### inventory_movements
Movimientos de inventario: entrada, ajuste, desperdicio, descuento por venta.
- id (uuid pk)
- inventory_item_id (uuid fk -> inventory_items cascade)
- movement_type (text, not null) -- entrada, ajuste, desperdicio, venta
- quantity (numeric(14,2), not null) -- positivo entrada, negativo salida
- reason (text)
- sale_id (uuid fk -> sales, opcional)
- created_at (timestamptz)

## 2. Seguridad
- RLS habilitado en todas las tablas.
- Políticas anon+authenticated CRUD (single-tenant, sin login, datos compartidos del negocio).

## 3. Notas
- Precios en COP enteros (numeric(12,0)).
- Los snapshots (product_name, unit_price) preservan el historial aunque se editen/borren productos.
- order_number usa una secuencia dedicada para numeración legible.
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_order int NOT NULL DEFAULT 0,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  description text,
  image_url text,
  base_price numeric(12,0) NOT NULL DEFAULT 0,
  cost numeric(12,0),
  is_active boolean NOT NULL DEFAULT true,
  has_variants boolean NOT NULL DEFAULT false,
  badge text,
  display_order int NOT NULL DEFAULT 0,
  is_demo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(12,0) NOT NULL,
  display_order int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS toppings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(12,0) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total numeric(12,0) NOT NULL,
  payment_method text NOT NULL,
  amount_received numeric(12,0),
  change numeric(12,0),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  variant_name text,
  unit_price numeric(12,0) NOT NULL,
  cost numeric(12,0),
  quantity int NOT NULL CHECK (quantity >= 1),
  subtotal numeric(12,0) NOT NULL,
  toppings_names text[]
);

CREATE SEQUENCE IF NOT EXISTS orders_order_number_seq START 1001;

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number int NOT NULL DEFAULT nextval('orders_order_number_seq'),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  delivery_date timestamptz,
  total numeric(12,0) NOT NULL DEFAULT 0,
  deposit numeric(12,0) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendiente',
  items_summary text,
  notes text,
  settled boolean NOT NULL DEFAULT false,
  sale_id uuid REFERENCES sales(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text NOT NULL,
  quantity numeric(14,2) NOT NULL DEFAULT 0,
  low_stock_threshold numeric(14,2) NOT NULL DEFAULT 0,
  cost_per_unit numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity numeric(14,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  movement_type text NOT NULL,
  quantity numeric(14,2) NOT NULL,
  reason text,
  sale_id uuid REFERENCES sales(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_recipe_product ON recipe_items(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_item ON inventory_movements(inventory_item_id);

-- RLS en todas las tablas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE toppings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Políticas CRUD para anon+authenticated (single-tenant, sin login)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['categories','products','product_variants','toppings','customers','sales','sale_items','orders','inventory_items','recipe_items','inventory_movements']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "anon_select_%s" ON %I;', t, t);
    EXECUTE format('CREATE POLICY "anon_select_%s" ON %I FOR SELECT TO anon, authenticated USING (true);', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_insert_%s" ON %I;', t, t);
    EXECUTE format('CREATE POLICY "anon_insert_%s" ON %I FOR INSERT TO anon, authenticated WITH CHECK (true);', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_update_%s" ON %I;', t, t);
    EXECUTE format('CREATE POLICY "anon_update_%s" ON %I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_delete_%s" ON %I;', t, t);
    EXECUTE format('CREATE POLICY "anon_delete_%s" ON %I FOR DELETE TO anon, authenticated USING (true);', t, t);
  END LOOP;
END $$;
