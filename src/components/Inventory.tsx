import { useState, useEffect } from 'react';
import { useInventory, useCatalog } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast';
import { Button } from './Button';
import { Modal } from './Modal';
import type { InventoryItem } from '@/lib/types';
import { Plus, Pencil, Trash2, AlertTriangle, Package, ArrowDownUp } from 'lucide-react';

export function Inventory() {
  const { items, reload } = useInventory();
  const { products } = useCatalog();
  const { notify } = useToast();
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [showRecipes, setShowRecipes] = useState(false);

  const remove = async (it: InventoryItem) => {
    if (!confirm(`¿Eliminar "${it.name}" del inventario?`)) return;
    const { error } = await supabase.from('inventory_items').delete().eq('id', it.id);
    if (error) {
      notify('error', 'No se pudo eliminar.');
      return;
    }
    notify('success', 'Item eliminado.');
    reload();
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Ingredientes, existencias y recetas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowRecipes(true)}>
            Recetas
          </Button>
          <Button onClick={() => setCreating(true)} size="lg">
            <Plus className="w-5 h-5" />
            Nuevo item
          </Button>
        </div>
      </div>

      <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 text-sm text-sky-800 mb-4">
        Las ventas descuentan automáticamente los ingredientes de las recetas
        configuradas. Si no hay receta, la venta no se bloquea.
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No hay items de inventario.</p>
          <p className="text-sm mt-1">
            Agrega ingredientes para controlar existencias.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((it) => {
            const low =
              it.low_stock_threshold > 0 && it.quantity <= it.low_stock_threshold;
            return (
              <div
                key={it.id}
                className={`bg-white rounded-2xl border shadow-sm p-4 ${low ? 'border-red-200' : 'border-gray-100'}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{it.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Unidad: {it.unit}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setAdjustItem(it)}
                      className="p-1.5 rounded-lg text-sky-500 hover:bg-sky-50"
                      title="Ajustar / entrada / desperdicio"
                    >
                      <ArrowDownUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditing(it)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(it)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span
                    className={`text-2xl font-bold ${low ? 'text-red-600' : 'text-gray-800'}`}
                  >
                    {it.quantity}
                  </span>
                  <span className="text-sm text-gray-400">{it.unit}</span>
                  {low && (
                    <span className="ml-auto text-xs text-red-600 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Bajo
                    </span>
                  )}
                </div>
                {it.low_stock_threshold > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Mínimo: {it.low_stock_threshold} {it.unit}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {(editing || creating) && (
        <ItemForm
          item={editing}
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

      {adjustItem && (
        <AdjustModal
          item={adjustItem}
          onClose={() => setAdjustItem(null)}
          onDone={() => {
            reload();
            setAdjustItem(null);
          }}
        />
      )}

      {showRecipes && (
        <RecipesModal
          products={products}
          onClose={() => setShowRecipes(false)}
          onSaved={reload}
        />
      )}
    </div>
  );
}

function ItemForm({
  item,
  onClose,
  onSaved,
}: {
  item: InventoryItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [name, setName] = useState(item?.name ?? '');
  const [unit, setUnit] = useState(item?.unit ?? 'ml');
  const [quantity, setQuantity] = useState(String(item?.quantity ?? '0'));
  const [threshold, setThreshold] = useState(
    String(item?.low_stock_threshold ?? '0'),
  );
  const [cost, setCost] = useState(String(item?.cost_per_unit ?? ''));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      notify('error', 'El nombre es obligatorio.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        unit,
        quantity: parseFloat(quantity || '0'),
        low_stock_threshold: parseFloat(threshold || '0'),
        cost_per_unit: cost ? parseFloat(cost) : null,
        updated_at: new Date().toISOString(),
      };
      if (item) {
        const { error } = await supabase
          .from('inventory_items')
          .update(payload)
          .eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('inventory_items').insert(payload);
        if (error) throw error;
      }
      notify('success', 'Item guardado.');
      onSaved();
    } catch {
      notify('error', 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={item ? 'Editar item' : 'Nuevo item'}
      size="sm"
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">
            Nombre
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-sky-500 outline-none"
            placeholder="Leche entera"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">
              Unidad
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-sky-500 outline-none"
            >
              <option value="ml">ml</option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="l">l</option>
              <option value="unidad">unidad</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">
              Cantidad
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-sky-500 outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">
              Alerta mínimo
            </label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-sky-500 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">
              Costo/unidad
            </label>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-sky-500 outline-none"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={save} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AdjustModal({
  item,
  onClose,
  onDone,
}: {
  item: InventoryItem;
  onClose: () => void;
  onDone: () => void;
}) {
  const { notify } = useToast();
  const [type, setType] = useState('entrada');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const amt = parseFloat(amount || '0');
    if (amt <= 0) {
      notify('error', 'La cantidad debe ser mayor a 0.');
      return;
    }
    setSaving(true);
    try {
      const delta =
        type === 'entrada' ? amt : type === 'desperdicio' ? -amt : amt;
      const { error: upd } = await supabase
        .from('inventory_items')
        .update({
          quantity: item.quantity + delta,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);
      if (upd) throw upd;
      const { error: mov } = await supabase
        .from('inventory_movements')
        .insert({
          inventory_item_id: item.id,
          movement_type: type,
          quantity: delta,
          reason: reason.trim() || null,
        });
      if (mov) throw mov;
      notify('success', 'Movimiento registrado.');
      onDone();
    } catch {
      notify('error', 'No se pudo registrar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Ajustar: ${item.name}`} size="sm">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            ['entrada', 'Entrada'],
            ['desperdicio', 'Desperdicio'],
            ['ajuste', 'Ajuste'],
          ].map(([v, label]) => (
            <button
              key={v}
              onClick={() => setType(v)}
              className={`py-2.5 rounded-lg text-sm font-medium border-2 ${
                type === v
                  ? 'border-sky-500 bg-sky-50 text-sky-700'
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">
            Cantidad ({item.unit})
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-sky-500 outline-none"
            autoFocus
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">
            Motivo (opcional)
          </label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-sky-500 outline-none"
          />
        </div>
        <p className="text-xs text-gray-400">
          {type === 'entrada' && 'Suma existencias.'}
          {type === 'desperdicio' && 'Resta existencias.'}
          {type === 'ajuste' && 'Suma o resta según signo (usa negativo para restar).'}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={save} disabled={saving}>
            {saving ? 'Guardando...' : 'Registrar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function RecipesModal({
  products,
  onClose,
  onSaved,
}: {
  products: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const { items } = useInventory();
  const [productId, setProductId] = useState(products[0]?.id ?? '');
  const [rows, setRows] = useState<
    { id: string; itemId: string; qty: string }[]
  >([]);

  const loadRecipe = async (pid: string) => {
    setProductId(pid);
    const { data } = await supabase
      .from('recipe_items')
      .select('id, inventory_item_id, quantity')
      .eq('product_id', pid);
    setRows(
      (data ?? []).map((r) => ({
        id: r.id,
        itemId: r.inventory_item_id,
        qty: String(r.quantity),
      })),
    );
  };

  useEffect(() => {
    if (productId) loadRecipe(productId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addRow = () =>
    setRows((r) => [
      ...r,
      { id: 'tmp-' + Date.now(), itemId: items[0]?.id ?? '', qty: '' },
    ]);

  const updateRow = (idx: number, field: 'itemId' | 'qty', value: string) =>
    setRows((r) =>
      r.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    );

  const removeRow = (idx: number) => setRows((r) => r.filter((_, i) => i !== idx));

  const save = async () => {
    if (!productId) return;
    await supabase.from('recipe_items').delete().eq('product_id', productId);
    const valid = rows.filter((r) => r.itemId && parseFloat(r.qty) > 0);
    if (valid.length) {
      const { error } = await supabase.from('recipe_items').insert(
        valid.map((r) => ({
          product_id: productId,
          inventory_item_id: r.itemId,
          quantity: parseFloat(r.qty),
        })),
      );
      if (error) {
        notify('error', 'No se pudo guardar la receta.');
        return;
      }
    }
    notify('success', 'Receta guardada.');
    onSaved();
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Recetas por producto" size="md">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">
            Producto
          </label>
          <select
            value={productId}
            onChange={(e) => loadRecipe(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-sky-500 outline-none"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={row.id} className="flex gap-2 items-center">
              <select
                value={row.itemId}
                onChange={(e) => updateRow(i, 'itemId', e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-sky-500"
              >
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name} ({it.unit})
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={row.qty}
                onChange={(e) => updateRow(i, 'qty', e.target.value)}
                placeholder="Cantidad"
                className="w-28 px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-sky-500"
              />
              <button
                onClick={() => removeRow(i)}
                className="p-2 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={addRow}
            className="text-sm text-sky-600 font-medium flex items-center gap-1 hover:underline"
          >
            <Plus className="w-4 h-4" />
            Agregar ingrediente
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Cada vez que se venda este producto, se descontarán estas cantidades
          del inventario automáticamente.
        </p>

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cerrar
          </Button>
          <Button className="flex-1" onClick={save}>
            Guardar receta
          </Button>
        </div>
      </div>
    </Modal>
  );
}
