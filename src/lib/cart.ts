export interface CartTopping {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  key: string;
  productId: string;
  name: string;
  variantId: string | null;
  variantName: string | null;
  unitPrice: number;
  cost: number | null;
  quantity: number;
  toppings: CartTopping[];
}

export const cartItemTotal = (item: CartItem): number => {
  const toppingsTotal = item.toppings.reduce((s, t) => s + t.price, 0);
  return (item.unitPrice + toppingsTotal) * item.quantity;
};

export const cartTotal = (items: CartItem[]): number =>
  items.reduce((s, i) => s + cartItemTotal(i), 0);

export const cartItemCount = (items: CartItem[]): number =>
  items.reduce((s, i) => s + i.quantity, 0);

export const makeCartItemKey = (
  productId: string,
  variantId: string | null,
  toppings: CartTopping[],
): string => {
  const tids = toppings
    .map((t) => t.id)
    .sort()
    .join(',');
  return `${productId}:${variantId ?? 'none'}:${tids}`;
};
