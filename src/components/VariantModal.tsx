import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import type { Product, ProductVariant, Topping } from '@/lib/types';
import { CartTopping } from '@/lib/cart';
import { formatCOP } from '@/lib/format';
import { Check } from 'lucide-react';

interface Props {
  product: Product | null;
  toppings: Topping[];
  onClose: () => void;
  onConfirm: (variant: ProductVariant, selectedToppings: CartTopping[]) => void;
}

export function VariantModal({ product, toppings, onClose, onConfirm }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product?.variants?.[0] ?? null,
  );
  const [selectedToppings, setSelectedToppings] = useState<CartTopping[]>([]);

  if (!product) return null;

  const toggleTopping = (t: Topping) => {
    setSelectedToppings((prev) =>
      prev.some((s) => s.id === t.id)
        ? prev.filter((s) => s.id !== t.id)
        : [...prev, { id: t.id, name: t.name, price: t.price }],
    );
  };

  const totalToppings = selectedToppings.reduce((s, t) => s + t.price, 0);
  const total =
    (selectedVariant ? selectedVariant.price : product.base_price) +
    totalToppings;

  return (
    <Modal
      open={!!product}
      onClose={onClose}
      title={product.name}
      size="md"
    >
      {product.image_url && (
        <div className="mb-5 -mx-6 -mt-6 h-32 overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="space-y-5">
        {product.variants && product.variants.length > 0 && (
          <div>
            <p className="text-sm font-bold font-display text-choco-600 mb-2">
              Elige el tamaño
            </p>
            <div className="grid grid-cols-3 gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`px-3 py-3 rounded-2xl border-2 text-center transition-all ${
                    selectedVariant?.id === v.id
                      ? 'border-strawberry-400 bg-strawberry-50 text-strawberry-600'
                      : 'border-cream-200 hover:border-strawberry-200 text-choco-500 bg-cream-50'
                  }`}
                >
                  <span className="block text-sm font-bold">{v.name}</span>
                  <span className="block text-sm text-choco-400 mt-0.5">
                    {formatCOP(v.price)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {toppings.length > 0 && (
          <div>
            <p className="text-sm font-bold font-display text-choco-600 mb-2">
              Adicionales (opcional)
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {toppings.map((t) => {
                const checked = selectedToppings.some((s) => s.id === t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleTopping(t)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all ${
                      checked
                        ? 'border-pistachio-300 bg-pistachio-50'
                        : 'border-cream-200 hover:border-pistachio-200 bg-cream-50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 transition-all ${
                          checked
                            ? 'bg-pistachio-400 border-pistachio-400 text-white'
                            : 'border-cream-300'
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5" />}
                      </span>
                      <span className="text-sm font-semibold text-choco-500">
                        {t.name}
                      </span>
                    </span>
                    <span className="text-sm font-medium text-choco-400">
                      +{formatCOP(t.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-cream-200">
          <div>
            <span className="text-xs text-choco-400 font-medium">Total</span>
            <p className="text-xl font-bold font-display text-choco-600">
              {formatCOP(total)}
            </p>
          </div>
          <Button
            disabled={!selectedVariant}
            onClick={() =>
              selectedVariant && onConfirm(selectedVariant, selectedToppings)
            }
            size="lg"
          >
            Agregar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
