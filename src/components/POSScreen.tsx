import { useState, useMemo } from 'react';
import { useCatalog } from '@/lib/hooks';
import {
  CartItem,
  CartTopping,
  makeCartItemKey,
  cartTotal,
  cartItemCount,
} from '@/lib/cart';
import { formatCOP } from '@/lib/format';
import type { Product, ProductVariant, Category } from '@/lib/types';
import { ProductCard } from './ProductCard';
import { CartPanel } from './CartPanel';
import { VariantModal } from './VariantModal';
import { CheckoutModal } from './CheckoutModal';
import { useToast } from '@/lib/toast';
import { ShoppingCart, Loader2, IceCream2, GlassWater, Plus, CupSoda } from 'lucide-react';

interface Props {
  onNavigate: (tab: string) => void;
}

const CATEGORY_STYLES: Record<
  string,
  { active: string; idle: string; icon: typeof IceCream2 }
> = {
  Helados: {
    active: 'bg-strawberry-600 text-white shadow-warm',
    idle: 'bg-white text-choco-500 border border-cream-200 hover:border-strawberry-300',
    icon: IceCream2,
  },
  Malteadas: {
    active: 'bg-choco-500 text-white shadow-soft',
    idle: 'bg-white text-choco-500 border border-cream-200 hover:border-choco-400',
    icon: GlassWater,
  },
  Adicionales: {
    active: 'bg-butter-400 text-choco-600 shadow-soft',
    idle: 'bg-white text-choco-500 border border-cream-200 hover:border-butter-300',
    icon: Plus,
  },
  Otros: {
    active: 'bg-pistachio-600 text-white shadow-soft',
    idle: 'bg-white text-choco-500 border border-cream-200 hover:border-pistachio-400',
    icon: CupSoda,
  },
};

const getCatStyle = (name: string) =>
  CATEGORY_STYLES[name] ?? {
    active: 'bg-strawberry-600 text-white shadow-warm',
    idle: 'bg-white text-choco-500 border border-cream-200 hover:border-strawberry-300',
    icon: IceCream2,
  };

export function POSScreen({}: Props) {
  const { categories, products, toppings, loading, error } = useCatalog();
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const { notify } = useToast();

  const activeCatId = useMemo(() => {
    if (!categories.length) return '';
    if (!activeCategory) return categories[0].id;
    return activeCategory;
  }, [categories, activeCategory]);

  const activeCatName = useMemo(
    () => categories.find((c) => c.id === activeCatId)?.name ?? '',
    [categories, activeCatId],
  );

  const visibleProducts = useMemo(
    () =>
      products.filter(
        (p) => p.is_active && p.category_id === activeCatId,
      ),
    [products, activeCatId],
  );

  const addToCartSimple = (product: Product) => {
    setCart((prev) => {
      const key = makeCartItemKey(product.id, null, []);
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          name: product.name,
          variantId: null,
          variantName: null,
          unitPrice: product.base_price,
          cost: product.cost,
          quantity: 1,
          toppings: [],
        },
      ];
    });
  };

  const addVariantToCart = (
    product: Product,
    variant: ProductVariant,
    selectedToppings: CartTopping[],
  ) => {
    setCart((prev) => {
      const key = makeCartItemKey(product.id, variant.id, selectedToppings);
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          name: product.name,
          variantId: variant.id,
          variantName: variant.name,
          unitPrice: variant.price,
          cost: product.cost,
          quantity: 1,
          toppings: selectedToppings,
        },
      ];
    });
    setVariantProduct(null);
  };

  const handleProductClick = (product: Product) => {
    if (product.has_variants && product.variants && product.variants.length) {
      setVariantProduct(product);
    } else {
      addToCartSimple(product);
    }
  };

  const inc = (key: string) =>
    setCart((p) =>
      p.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i)),
    );
  const dec = (key: string) =>
    setCart((p) =>
      p.flatMap((i) => {
        if (i.key !== key) return [i];
        if (i.quantity <= 1) return [];
        return [{ ...i, quantity: i.quantity - 1 }];
      }),
    );
  const remove = (key: string) =>
    setCart((p) => p.filter((i) => i.key !== key));
  const clear = () => {
    if (cart.length === 0) return;
    if (confirm('¿Vaciar la venta actual?')) {
      setCart([]);
      notify('info', 'Venta vaciada.');
    }
  };

  const total = cartTotal(cart);
  const count = cartItemCount(cart);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-8 h-8 text-strawberry-400 animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-20 text-red-500">{error}</div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
      {/* Catálogo */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Category tabs */}
        <div className="flex gap-2.5 p-3 overflow-x-auto bg-cream-50/80 backdrop-blur-sm border-b border-cream-200 lg:sticky lg:top-0 lg:z-10">
          {categories.map((cat: Category) => {
            const style = getCatStyle(cat.name);
            const Icon = style.icon;
            const active = activeCatId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all active:scale-95 ${
                  active ? style.active : style.idle
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={active ? 2.4 : 2} />
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 bg-cream-dots">
          {visibleProducts.length === 0 ? (
            <div className="text-center py-16 text-choco-400">
              <IceCream2 className="w-12 h-12 mx-auto mb-3 text-cream-300" />
              <p className="font-semibold">No hay productos en esta categoría.</p>
              <p className="text-sm mt-1">
                Agrega productos desde el módulo de administración.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-choco-400 font-semibold mb-3 px-1 uppercase tracking-wider">
                {visibleProducts.length} producto{visibleProducts.length !== 1 ? 's' : ''} · {activeCatName}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                {visibleProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onClick={() => handleProductClick(p)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cart panel - desktop */}
      <aside className="hidden lg:flex w-[360px] xl:w-[400px] bg-white border-l border-cream-200 flex-col shadow-soft">
        <CartPanel
          items={cart}
          onInc={inc}
          onDec={dec}
          onRemove={remove}
          onClear={clear}
          onCheckout={() => setCheckoutOpen(true)}
        />
      </aside>

      {/* Floating cart button - mobile */}
      {count > 0 && !mobileCartOpen && (
        <button
          onClick={() => setMobileCartOpen(true)}
          className="lg:hidden fixed bottom-4 right-4 z-40 bg-strawberry-500 text-white rounded-full shadow-warm px-5 py-3.5 flex items-center gap-2 font-bold active:scale-95 transition-transform"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="bg-white text-strawberry-500 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-cartBump">
            {count}
          </span>
          <span>{formatCOP(total)}</span>
        </button>
      )}

      {/* Cart panel - mobile drawer */}
      {mobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-choco-900/40 backdrop-blur-sm"
            onClick={() => setMobileCartOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-sm bg-white h-full flex flex-col animate-slideInRight shadow-soft-lg">
            <CartPanel
              items={cart}
              onInc={inc}
              onDec={dec}
              onRemove={remove}
              onClear={clear}
              onCheckout={() => {
                setMobileCartOpen(false);
                setCheckoutOpen(true);
              }}
              onCloseMobile={() => setMobileCartOpen(false)}
              isMobileOpen
            />
          </div>
        </div>
      )}

      <VariantModal
        product={variantProduct}
        toppings={toppings}
        onClose={() => setVariantProduct(null)}
        onConfirm={(variant, tops) =>
          variantProduct && addVariantToCart(variantProduct, variant, tops)
        }
      />

      <CheckoutModal
        open={checkoutOpen}
        items={cart}
        onClose={() => setCheckoutOpen(false)}
        onCompleted={() => {
          setCart([]);
          setMobileCartOpen(false);
        }}
      />
    </div>
  );
}
