import { useState, useMemo } from 'react';
import { useCatalog } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast';
import { formatCOP } from '@/lib/format';
import { Button } from './Button';
import { Modal } from './Modal';
import type { Product, Category, ProductVariant } from '@/lib/types';
import {
  Plus,
  Pencil,
  Trash2,
  Power,
  X,
  GripVertical,
  IceCream2,
} from 'lucide-react';

interface Props {
  onNavigate: (tab: string) => void;
}

const DEMO_IMAGE =
  'https://images.pexels.com/photos/7525078/pexels-photo-7525078.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export function ProductsAdmin({}: Props) {
  const { categories, products, toppings, loading, reload } = useCatalog();
  const { notify } = useToast();
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (filterCat === 'all' || p.category_id === filterCat) &&
          (showInactive || p.is_active),
      ),
    [products, filterCat, showInactive],
  );

  const toggleActive = async (p: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !p.is_active, updated_at: new Date().toISOString() })
      .eq('id', p.id);
    if (error) {
      notify('error', 'No se pudo cambiar el estado.');
      return;
    }
    notify('success', p.is_active ? 'Producto desactivado.' : 'Producto activado.');
    reload();
  };

  const remove = async (p: Product) => {
    if (
      !confirm(
        `¿Eliminar "${p.name}"? Esta acción no afecta el historial de ventas.`,
      )
    )
      return;
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    if (error) {
      notify('error', 'No se pudo eliminar el producto.');
      return;
    }
    notify('success', 'Producto eliminado.');
    reload();
  };

  if (loading) {
    return <div className="p-6 text-choco-400">Cargando productos...</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold font-display text-choco-600">Productos</h1>
          <p className="text-sm text-choco-400 mt-0.5">
            Administra el catálogo de la heladería
          </p>
        </div>
        <Button onClick={() => setCreating(true)} size="lg">
          <Plus className="w-5 h-5" />
          Nuevo producto
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center mb-4">
        <button
          onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-sm font-bold ${filterCat === 'all' ? 'bg-strawberry-500 text-white' : 'bg-cream-100 text-choco-500 border border-cream-200'}`}
        >
          Todas
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilterCat(c.id)}
            className={`px-3 py-1.5 rounded-xl text-sm font-bold ${filterCat === c.id ? 'bg-strawberry-500 text-white' : 'bg-cream-100 text-choco-500 border border-cream-200'}`}
          >
            {c.name}
          </button>
        ))}
        <label className="flex items-center gap-2 ml-auto text-sm text-choco-500">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Mostrar inactivos
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((p) => (
          <div
            key={p.id}
            className={`bg-white rounded-2xl border border-cream-200 shadow-soft overflow-hidden ${p.is_active ? '' : 'opacity-60'}`}
          >
            <div className="flex gap-3 p-3">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-cream-100 shrink-0">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-cream-300">
                    <IceCream2 className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <p className="font-bold font-display text-sm text-choco-600 line-clamp-1">
                    {p.name}
                  </p>
                  {p.is_demo && (
                    <span className="text-[9px] bg-butter-100 text-butter-400 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                      DEMO
                    </span>
                  )}
                </div>
                <p className="text-xs text-choco-400 line-clamp-1 mt-0.5">
                  {p.description || 'Sin descripción'}
                </p>
                <p className="text-base font-bold font-display text-strawberry-500 mt-1">
                  {formatCOP(p.base_price)}
                </p>
                {p.variants && p.variants.length > 0 && (
                  <p className="text-xs text-choco-400 mt-0.5">
                    {p.variants.length} variantes
                  </p>
                )}
              </div>
            </div>
            <div className="flex border-t border-cream-200 divide-x divide-cream-200">
              <button
                onClick={() => setEditing(p)}
                className="flex-1 py-2 text-xs font-semibold text-choco-500 hover:bg-cream-100 flex items-center justify-center gap-1'"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </button>
              <button
                onClick={() => toggleActive(p)}
                className={`flex-1 py-2 text-xs font-semibold hover:bg-cream-100 flex items-center justify-center gap-1 ${p.is_active ? 'text-butter-400' : 'text-pistachio-500'}`}
              >
                <Power className="w-3.5 h-3.5" />
                {p.is_active ? 'Desactivar' : 'Activar'}
              </button>
              <button
                onClick={() => remove(p)}
                className="flex-1 py-2 text-xs font-semibold text-red-400 hover:bg-red-50 flex items-center justify-center gap-1'"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-choco-400">
          <p>No hay productos para mostrar.</p>
        </div>
      )}

      {(editing || creating) && (
        <ProductForm
          product={editing}
          categories={categories}
          existingToppings={toppings}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            reload();
            setEditing(null);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

interface FormProps {
  product: Product | null;
  categories: Category[];
  existingToppings: { id: string; name: string; price: number; is_active: boolean }[];
  onClose: () => void;
  onSaved: () => void;
}

function ProductForm({
  product,
  categories,
  onClose,
  onSaved,
}: FormProps) {
  const { notify } = useToast();
  const [name, setName] = useState(product?.name ?? '');
  const [categoryId, setCategoryId] = useState(
    product?.category_id ?? categories[0]?.id ?? '',
  );
  const [description, setDescription] = useState(product?.description ?? '');
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '');
  const [basePrice, setBasePrice] = useState(
    String(product?.base_price ?? '5000'),
  );
  const [cost, setCost] = useState(String(product?.cost ?? ''));
  const [badge, setBadge] = useState(product?.badge ?? '');
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [hasVariants, setHasVariants] = useState(product?.has_variants ?? false);
  const [variants, setVariants] = useState<ProductVariant[]>(
    product?.variants ?? [],
  );
  const [saving, setSaving] = useState(false);

  const addVariant = () =>
    setVariants((v) => [
      ...v,
      {
        id: 'tmp-' + Date.now(),
        product_id: product?.id ?? '',
        name: '',
        price: 0,
        display_order: v.length + 1,
      },
    ]);

  const updateVariant = (idx: number, field: 'name' | 'price', value: string) =>
    setVariants((v) =>
      v.map((vr, i) =>
        i === idx
          ? { ...vr, [field]: field === 'price' ? parseInt(value || '0', 10) : value }
          : vr,
      ),
    );

  const removeVariant = (idx: number) =>
    setVariants((v) => v.filter((_, i) => i !== idx));

  const save = async () => {
    if (!name.trim()) {
      notify('error', 'El nombre es obligatorio.');
      return;
    }
    if (!categoryId) {
      notify('error', 'Selecciona una categoría.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        category_id: categoryId,
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        base_price: parseInt(basePrice || '0', 10),
        cost: cost ? parseInt(cost, 10) : null,
        badge: badge.trim() || null,
        is_active: isActive,
        has_variants: hasVariants,
        is_demo: false,
        updated_at: new Date().toISOString(),
      };

      if (product) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', product.id);
        if (error) throw error;
        if (hasVariants) {
          await supabase
            .from('product_variants')
            .delete()
            .eq('product_id', product.id);
          const valid = variants.filter((v) => v.name.trim());
          if (valid.length) {
            await supabase.from('product_variants').insert(
              valid.map((v, i) => ({
                product_id: product.id,
                name: v.name.trim(),
                price: v.price,
                display_order: i + 1,
              })),
            );
          }
        }
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        if (hasVariants) {
          const valid = variants.filter((v) => v.name.trim());
          if (valid.length) {
            await supabase.from('product_variants').insert(
              valid.map((v, i) => ({
                product_id: data.id,
                name: v.name.trim(),
                price: v.price,
                display_order: i + 1,
              })),
            );
          }
        }
      }
      notify('success', 'Producto guardado.');
      onSaved();
    } catch (err) {
      console.error(err);
      notify('error', 'No se pudo guardar el producto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={product ? 'Editar producto' : 'Nuevo producto'}
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold font-display text-choco-600 block mb-1">
              Nombre
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-cream-200 bg-cream-50 focus:border-strawberry-400 focus:ring-2 focus:ring-strawberry-100 outline-none"
              placeholder="Helado de chocolate"
            />
          </div>
          <div>
            <label className="text-sm font-bold font-display text-choco-600 block mb-1">
              Categoría
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-cream-200 bg-cream-50 focus:border-strawberry-400 focus:ring-2 focus:ring-strawberry-100 outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold font-display text-choco-600 block mb-1">
            Descripción (opcional)
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-cream-200 bg-cream-50 focus:border-strawberry-400 focus:ring-2 focus:ring-strawberry-100 outline-none"
            placeholder="Helado cremoso artesanal"
          />
        </div>

        <div>
          <label className="text-sm font-bold font-display text-choco-600 block mb-1">
            URL de imagen
          </label>
          <div className="flex gap-2">
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl border-2 border-cream-200 bg-cream-50 focus:border-strawberry-400 focus:ring-2 focus:ring-strawberry-100 outline-none text-sm"
              placeholder="https://..."
            />
            <Button variant="secondary" onClick={() => setImageUrl(DEMO_IMAGE)}>
              Usar demo
            </Button>
          </div>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="preview"
              className="w-24 h-24 object-cover rounded-2xl mt-2 border border-cream-200"
            />
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-bold font-display text-choco-600 block mb-1">
              Precio (COP)
            </label>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-cream-200 bg-cream-50 focus:border-strawberry-400 focus:ring-2 focus:ring-strawberry-100 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-bold font-display text-choco-600 block mb-1">
              Costo estimado (opcional)
            </label>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-cream-200 bg-cream-50 focus:border-strawberry-400 focus:ring-2 focus:ring-strawberry-100 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-bold font-display text-choco-600 block mb-1">
              Etiqueta (opcional)
            </label>
            <input
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-cream-200 bg-cream-50 focus:border-strawberry-400 focus:ring-2 focus:ring-strawberry-100 outline-none"
              placeholder="Más vendido / Nuevo"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-choco-500">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded"
            />
            Activo
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-choco-500">
            <input
              type="checkbox"
              checked={hasVariants}
              onChange={(e) => setHasVariants(e.target.checked)}
              className="rounded"
            />
            Tiene variantes (tamaños)
          </label>
        </div>

        {hasVariants && (
          <div className="bg-cream-100 rounded-2xl p-3 space-y-2 border border-cream-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold font-display text-choco-600">Variantes</p>
              <button
                onClick={addVariant}
                className="text-xs text-strawberry-500 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar
              </button>
            </div>
            {variants.map((v, i) => (
              <div key={v.id} className="flex gap-2 items-center">
                <input
                  value={v.name}
                  onChange={(e) => updateVariant(i, 'name', e.target.value)}
                  placeholder="Mediano"
                  className="flex-1 px-3 py-2 rounded-xl border-2 border-cream-200 bg-cream-50 text-sm outline-none focus:border-strawberry-400"
                />
                <input
                  type="number"
                  value={v.price}
                  onChange={(e) => updateVariant(i, 'price', e.target.value)}
                  placeholder="10000"
                  className="w-28 px-3 py-2 rounded-xl border-2 border-cream-200 bg-cream-50 text-sm outline-none focus:border-strawberry-400"
                />
                <button
                  onClick={() => removeVariant(i)}
                  className="p-2 text-choco-300 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {variants.length === 0 && (
              <p className="text-xs text-choco-400">
                Agrega variantes como Pequeño, Mediano, Grande.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={save}
            disabled={saving}
            size="lg"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
