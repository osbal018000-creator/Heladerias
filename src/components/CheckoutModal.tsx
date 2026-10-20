import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { CartItem, cartTotal } from '@/lib/cart';
import { formatCOP } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast';
import {
  Banknote,
  Smartphone,
  CreditCard,
  Wallet,
  CheckCircle2,
  Printer,
} from 'lucide-react';

interface Props {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onCompleted: () => void;
}

const METHODS = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'transferencia', label: 'Transferencia', icon: Smartphone },
  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { id: 'otro', label: 'Otro', icon: Wallet },
];

export function CheckoutModal({ open, items, onClose, onCompleted }: Props) {
  const [method, setMethod] = useState('efectivo');
  const [amountReceived, setAmountReceived] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState<{
    id: string;
    change: number;
  } | null>(null);
  const { notify } = useToast();

  const total = cartTotal(items);
  const receivedNum = method === 'efectivo' ? parseInt(amountReceived || '0', 10) : total;
  const change = receivedNum - total;
  const canComplete =
    method !== 'efectivo' || receivedNum >= total;

  const handleComplete = async () => {
    if (submitting) return;
    if (method === 'efectivo' && receivedNum < total) {
      notify('error', 'El efectivo recibido es insuficiente.');
      return;
    }
    setSubmitting(true);
    try {
      const { data: sale, error } = await supabase
        .from('sales')
        .insert({
          total,
          payment_method: method,
          amount_received: method === 'efectivo' ? receivedNum : null,
          change: method === 'efectivo' ? change : null,
        })
        .select()
        .single();
      if (error) throw error;

      const rows = items.map((it) => ({
        sale_id: sale.id,
        product_id: it.productId,
        product_name: it.name + (it.variantName ? ` (${it.variantName})` : ''),
        variant_name: it.variantName,
        unit_price: it.unitPrice,
        cost: it.cost,
        quantity: it.quantity,
        subtotal: it.unitPrice * it.quantity + it.toppings.reduce((s, t) => s + t.price, 0) * it.quantity,
        toppings_names: it.toppings.length ? it.toppings.map((t) => t.name) : null,
      }));
      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(rows);
      if (itemsError) throw itemsError;

      const productIds = items.map((i) => i.productId);
      if (productIds.length) {
        const { data: recipes } = await supabase
          .from('recipe_items')
          .select('product_id, inventory_item_id, quantity')
          .in('product_id', productIds);
        if (recipes && recipes.length) {
          const consumption: Record<string, number> = {};
          for (const r of recipes) {
            const qty =
              items
                .filter((i) => i.productId === r.product_id)
                .reduce((s, i) => s + i.quantity, 0) * r.quantity;
            consumption[r.inventory_item_id] =
              (consumption[r.inventory_item_id] ?? 0) + qty;
          }
          for (const [itemId, qty] of Object.entries(consumption)) {
            await supabase.rpc('decrement_inventory', {
              p_item_id: itemId,
              p_qty: qty,
              p_sale_id: sale.id,
            });
          }
        }
      }

      setCompleted({ id: sale.id, change: method === 'efectivo' ? change : 0 });
      notify('success', 'Venta registrada correctamente.');
    } catch (err) {
      notify('error', 'No se pudo registrar la venta.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (completed) {
      setCompleted(null);
      setMethod('efectivo');
      setAmountReceived('');
      onCompleted();
    } else {
      onClose();
    }
  };

  const printReceipt = () => {
    window.print();
  };

  if (completed) {
    return (
      <Modal open={open} onClose={handleClose} title="Venta completada" size="sm">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-pistachio-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-pistachio-500" />
          </div>
          <p className="text-lg font-bold font-display text-choco-600">
            {formatCOP(total)}
          </p>
          {method === 'efectivo' && completed.change > 0 && (
            <p className="text-sm text-choco-400 mt-1">
              Cambio: <span className="font-semibold">{formatCOP(completed.change)}</span>
            </p>
          )}
          <p className="text-xs text-choco-400 mt-2">
            Pago con {method}
          </p>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" className="flex-1" onClick={printReceipt}>
            <Printer className="w-4 h-4" />
            Imprimir recibo
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleClose}>
            Nueva venta
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Cobrar venta" size="md">
      <div className="space-y-5">
        <div className="bg-cream-100 rounded-2xl p-4 max-h-44 overflow-y-auto border border-cream-200">
          {items.map((it) => (
            <div
              key={it.key}
              className="flex justify-between text-sm py-1 border-b border-cream-200 last:border-0"
            >
              <span className="text-choco-500 font-medium">
                {it.quantity}× {it.name}
                {it.variantName ? ` (${it.variantName})` : ''}
              </span>
              <span className="font-semibold text-choco-600">
                {formatCOP(it.unitPrice * it.quantity + it.toppings.reduce((s, t) => s + t.price, 0) * it.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-choco-400 font-medium">Total a pagar</span>
          <span className="text-2xl font-bold font-display text-choco-600">
            {formatCOP(total)}
          </span>
        </div>

        <div>
          <p className="text-sm font-bold font-display text-choco-600 mb-2">
            Método de pago
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const active = method === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all ${
                    active
                      ? 'border-strawberry-400 bg-strawberry-50 text-strawberry-600'
                      : 'border-cream-200 hover:border-strawberry-200 text-choco-400 bg-cream-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {method === 'efectivo' && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-bold font-display text-choco-600 block mb-1.5">
                Efectivo recibido
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-2xl border-2 border-cream-200 bg-cream-50 focus:border-strawberry-400 focus:ring-2 focus:ring-strawberry-100 outline-none text-lg font-bold text-choco-600"
                autoFocus
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                {[total, 10000, 20000, 50000].map((q) => (
                  <button
                    key={q}
                    onClick={() => setAmountReceived(String(q))}
                    className="px-3 py-1 text-xs rounded-xl bg-cream-100 hover:bg-cream-200 text-choco-500 font-semibold border border-cream-200"
                  >
                    {formatCOP(q)}
                  </button>
                ))}
              </div>
            </div>
            {amountReceived && receivedNum >= total && (
              <div className="flex items-center justify-between bg-pistachio-50 rounded-2xl px-4 py-3 border border-pistachio-200">
                <span className="text-pistachio-600 font-semibold">Cambio</span>
                <span className="text-xl font-bold font-display text-pistachio-600">
                  {formatCOP(change)}
                </span>
              </div>
            )}
            {amountReceived && receivedNum < total && (
              <div className="bg-red-50 rounded-2xl px-4 py-3 text-red-600 text-sm font-semibold border border-red-200">
                El efectivo recibido es insuficiente. Faltan{' '}
                {formatCOP(total - receivedNum)}.
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="success"
            size="lg"
            className="flex-1"
            disabled={!canComplete || submitting}
            onClick={handleComplete}
          >
            {submitting ? 'Procesando...' : 'Confirmar pago'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
