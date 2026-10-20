export interface Category {
  id: string;
  name: string;
  display_order: number;
  icon: string | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  display_order: number;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  cost: number | null;
  is_active: boolean;
  has_variants: boolean;
  badge: string | null;
  display_order: number;
  is_demo: boolean;
  variants?: ProductVariant[];
}

export interface Topping {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  variant_name: string | null;
  unit_price: number;
  cost: number | null;
  quantity: number;
  subtotal: number;
  toppings_names: string[] | null;
}

export interface Sale {
  id: string;
  total: number;
  payment_method: string;
  amount_received: number | null;
  change: number | null;
  customer_id: string | null;
  notes: string | null;
  created_at: string;
  sale_items?: SaleItem[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
}

export type OrderStatus =
  | 'pendiente'
  | 'en_preparacion'
  | 'listo'
  | 'entregado'
  | 'cancelado';

export interface Order {
  id: string;
  order_number: number;
  customer_id: string | null;
  delivery_date: string | null;
  total: number;
  deposit: number;
  status: OrderStatus;
  items_summary: string | null;
  notes: string | null;
  settled: boolean;
  sale_id: string | null;
  created_at: string;
  customer?: Customer | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  low_stock_threshold: number;
  cost_per_unit: number | null;
  updated_at: string;
}

export interface RecipeItem {
  id: string;
  product_id: string;
  inventory_item_id: string;
  quantity: number;
}

export interface InventoryMovement {
  id: string;
  inventory_item_id: string;
  movement_type: string;
  quantity: number;
  reason: string | null;
  sale_id: string | null;
  created_at: string;
}
