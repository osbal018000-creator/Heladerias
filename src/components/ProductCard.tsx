import type { Product } from '@/lib/types';
import { formatCOP } from '@/lib/format';
import { Plus, Layers, Check } from 'lucide-react';
import { useState } from 'react';

interface Props {
  product: Product;
  onClick: () => void;
}

const badgeStyles: Record<string, string> = {
  'Más vendido': 'bg-strawberry-100 text-strawberry-700',
  Nuevo: 'bg-pistachio-100 text-choco-600',
  Favorito: 'bg-butter-100 text-choco-600',
};

export function ProductCard({ product, onClick }: Props) {
  const [justAdded, setJustAdded] = useState(false);

  const badgeClass = product.badge
    ? badgeStyles[product.badge] ?? 'bg-cream-200 text-choco-500'
    : '';

  const handleClick = () => {
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 600);
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className="group bg-white rounded-3xl overflow-hidden border border-cream-200 shadow-soft hover:shadow-soft-md hover:border-strawberry-200 hover:-translate-y-0.5 transition-all active:scale-[0.97] text-left flex flex-col"
    >
      <div className="relative aspect-[4/3] bg-cream-100 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cream-300">
            <Plus className="w-8 h-8" />
          </div>
        )}
        {/* Gradient overlay at bottom for label legibility */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-choco-900/20 to-transparent" />

        {product.badge && (
          <span
            className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${badgeClass} shadow-sm`}
          >
            {product.badge}
          </span>
        )}
        {product.has_variants && (
          <span className="absolute top-2.5 right-2.5 bg-white/95 text-choco-500 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-0.5 shadow-sm">
            <Layers className="w-3 h-3" />
            Variantes
          </span>
        )}
        {/* Added confirmation flash */}
        {justAdded && (
          <div className="absolute inset-0 bg-strawberry-500/20 flex items-center justify-center animate-popIn">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-soft-md">
              <Check className="w-7 h-7 text-strawberry-500" strokeWidth={3} />
            </div>
          </div>
        )}
      </div>
      <div className="p-3.5 flex flex-col flex-1">
        <p className="font-bold font-display text-sm text-choco-600 leading-tight line-clamp-2">
          {product.name}
        </p>
        {product.description && (
          <p className="text-xs text-choco-400 mt-0.5 line-clamp-1">
            {product.description}
          </p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="text-lg font-extrabold font-display text-strawberry-600">
            {formatCOP(product.base_price)}
          </span>
          <span className="w-7 h-7 rounded-full bg-cream-100 group-hover:bg-strawberry-100 flex items-center justify-center transition-colors">
            <Plus className="w-4 h-4 text-choco-400 group-hover:text-strawberry-500 transition-colors" strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </button>
  );
}
