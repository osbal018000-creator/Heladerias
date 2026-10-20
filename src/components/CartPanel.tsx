import { CartItem, cartItemTotal, cartTotal, cartItemCount } from '@/lib/cart';
import { formatCOP } from '@/lib/format';
import { Button } from './Button';
import {
  Trash2,
  Minus,
  Plus,
  X,
  CreditCard,
  IceCreamCone,
} from 'lucide-react';

interface Props {
  items: CartItem[];
  onInc: (key: string) => void;
  onDec: (key: string) => void;
  onRemove: (key: string) => void;
  onClear: () => void;
  onCheckout: () => void;
  onCloseMobile?: () => void;
  isMobileOpen?: boolean;
}

export function CartPanel({
  items,
  onInc,
  onDec,
  onRemove,
  onClear,
  onCheckout,
  onCloseMobile,
}: Props) {
  const total = cartTotal(items);
  const count = cartItemCount(items);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center bg-cream-50">
        <div className="relative w-20 h-20 mb-5">
          <div className="absolute inset-0 rounded-full bg-strawberry-100" />
          <div className="absolute inset-0 flex items-center justify-center">
            <IceCreamCone className="w-10 h-10 text-strawberry-400" strokeWidth={1.8} />
          </div>
        </div>
        <p className="font-bold font-display text-choco-500 text-lg">
          Tu próxima venta comienza aquí
        </p>
        <p className="text-sm text-choco-400 mt-1.5">
          Toca los productos del catálogo para agregarlos
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-cream-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-cream-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-strawberry-100 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-strawberry-500" />
          </div>
          <span className="font-bold font-display text-choco-600">
            Venta actual
          </span>
          <span className="bg-strawberry-100 text-strawberry-600 text-xs font-bold px-2 py-0.5 rounded-full animate-cartBump">
            {count}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg font-semibold transition-colors"
            title="Vaciar venta"
          >
            Vaciar
          </button>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded-lg hover:bg-cream-100 text-choco-400"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {items.map((item) => (
          <div
            key={item.key}
            className="bg-white rounded-2xl p-3 border border-cream-200 shadow-soft animate-fadeInUp"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold font-display text-sm text-choco-600 truncate">
                  {item.name}
                </p>
                {item.variantName && (
                  <p className="text-xs text-strawberry-500 font-medium">
                    {item.variantName}
                  </p>
                )}
                {item.toppings.length > 0 && (
                  <p className="text-xs text-choco-400 mt-0.5">
                    + {item.toppings.map((t) => t.name).join(', ')}
                  </p>
                )}
                <p className="text-xs text-choco-400 mt-0.5">
                  {formatCOP(item.unitPrice)}
                  {item.toppings.length > 0 &&
                    ` + ${formatCOP(item.toppings.reduce((s, t) => s + t.price, 0))}`}{' '}
                  c/u
                </p>
              </div>
              <button
                onClick={() => onRemove(item.key)}
                className="text-choco-300 hover:text-red-500 p-1 -mt-1 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2.5">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onDec(item.key)}
                  className="w-8 h-8 rounded-xl bg-cream-100 border border-cream-200 flex items-center justify-center text-choco-500 hover:bg-cream-200 active:scale-90 transition-all"
                >
                  <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
                <span className="w-9 text-center text-sm font-bold font-display text-choco-600">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onInc(item.key)}
                  className="w-8 h-8 rounded-xl bg-strawberry-100 border border-strawberry-200 flex items-center justify-center text-strawberry-600 hover:bg-strawberry-200 active:scale-90 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              </div>
              <span className="font-bold font-display text-sm text-choco-600">
                {formatCOP(cartItemTotal(item))}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Total & checkout */}
      <div className="border-t border-cream-200 p-4 space-y-3 bg-white">
        <div className="flex items-center justify-between">
          <span className="text-choco-400 text-sm font-medium">Total</span>
          <span className="text-2xl font-bold font-display text-choco-600">
            {formatCOP(total)}
          </span>
        </div>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={onCheckout}
        >
          <CreditCard className="w-5 h-5" />
          Cobrar venta
        </Button>
      </div>
    </div>
  );
}
