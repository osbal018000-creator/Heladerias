import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import type {
  Category,
  Product,
  Topping,
  Sale,
  Customer,
  Order,
  InventoryItem,
} from './types';

export function useCatalog() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [cat, prod, variants, top] = await Promise.all([
      supabase.from('categories').select('*').order('display_order'),
      supabase
        .from('products')
        .select('*')
        .order('display_order')
        .order('name'),
      supabase.from('product_variants').select('*').order('display_order'),
      supabase.from('toppings').select('*').order('name'),
    ]);
    if (cat.error || prod.error || variants.error || top.error) {
      setError('No se pudo cargar el catálogo.');
      setLoading(false);
      return;
    }
    const prodsWithVariants = (prod.data ?? []).map((p) => ({
      ...p,
      variants: (variants.data ?? [])
        .filter((v) => v.product_id === p.id)
        .sort((a, b) => a.display_order - b.display_order),
    }));
    setCategories(cat.data ?? []);
    setProducts(prodsWithVariants);
    setToppings(top.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { categories, products, toppings, loading, error, reload: load };
}

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) {
      setLoading(false);
      return;
    }
    setSales(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { sales, loading, reload: load };
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('name');
    setCustomers(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { customers, loading, reload: load };
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, customer:customers(*)')
      .order('created_at', { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { orders, loading, reload: load };
}

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('inventory_items').select('*').order('name');
    setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, reload: load };
}
