import { useState } from 'react';
import { useOrders, useCustomers } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast';
import { formatCOP, formatDateTime } from '@/lib/format';
import { Button } from './Button';
import { Modal } from './Modal';
import type { Order, OrderStatus } from '@/lib/types';
import { Plus, Package, CheckCircle2, XCircle, Printer } from 'lucide-react';

const STATUS_INFO: Record<
  OrderStatus,
  { label: string; color: string; bg: string }
> = {
  pendiente: { label: 'Pendiente', color: 'text-butter-400', bg: 'bg-butter-100' },
  en_preparacion: {
    label: 'En preparación',
    color: 'text-choco-500',
    bg: 'bg-cream-200',
  },
  listo: { label: 'Listo', color: 'text-pistachio-600', bg: 'bg-pistachio-100' },
  entregado: {
    label: 'Entregado',
    color: 'text-pistachio-600',
    bg: 'bg-pistachio-100',
  },
  cancelado: { label: 'Cancelado', color: 'text-red-600', bg: 'bg-red-100' },
};

const STATUS_FLOW: OrderStatus[] = [
  'pendiente',
  'en_preparacion',
  'listo',
  'entregado',
];

export function Orders() {
  const { orders, reload } = useOrders();
  const { customers } = useCustomers();
  const { notify } = useToast();
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);

  const updateStatus = async (order: Order, status: OrderStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', order.id);
    if (error) {
      notify('error', 'No se pudo actualizar.');
      return;
    }
    notify('success', 'Estado actualizado.');
    reload();
  };

  const settleOrder = async (order: Order) => {
    // Liquidar: crea una venta por el saldo pendiente y marca el pedido como settled.
    if (order.settled) {
      notify('info', 'Este pedido ya fue liquidado.');
      return;
    }
    const balance = order.total - order.deposit;
    if (balance <= 0) {
      // Si no hay saldo, solo marca como settled sin venta duplicada
      const { error } = await supabase
        .from('orders')
        .update({ settled: true })
        .eq('id', order.id);
      if (error) {
        notify('error', 'No se pudo liquidar.');
        return;
      }
      notify('success', 'Pedido liquidado (sin saldo pendiente).');
      reload();
      return;
    }
    // Crear venta por el saldo (NO incluye el abono, evita duplicar ingreso)
    const { data: sale, error: saleErr } = await supabase
      .from('sales')
      .insert({
        total: balance,
        payment_method: 'otro',
        notes: `Liquidación pedido #${order.order_number}`,
      })
      .select()
      .single();
    if (saleErr) {
      notify('error', 'No se pudo registrar la liquidación.');
      return;
    }
    const { error } = await supabase
      .from('orders')
      .update({ settled: true, sale_id: sale.id, status: 'entregado' })
      .eq('id', order.id);
    if (error) {
      notify('error', 'No se pudo actualizar el pedido.');
      return;
    }
    notify('success', `Pedido liquidado. Venta por ${formatCOP(balance)}.`);
    reload();
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold font-display text-choco-600">Pedidos especiales</h1>
          <p className="text-sm text-choco-400 mt-0.5">
            Pedidos anticipados, distintos de las ventas de mostrador
          </p>
        </div>
        <Button onClick={() => setCreating(true)} size="lg">
          <Plus className="w-5 h-5" />
          Nuevo pedido
        </Button>
      </div>

      <div className="bg-butter-50 border border-butter-200 rounded-2xl px-4 py-3 text-sm text-choco-500 font-medium mb-4">
        Los abonos no se registran como ventas completas. Al liquidar un pedido,
        solo se registra como venta el saldo pendiente, evitando duplicar
        ingresos.
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-choco-400">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30 text-cream-300" />
          <p>No hay pedidos registrados.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {orders.map((o) => {
            const info = STATUS_INFO[o.status];
            const balance = o.total - o.deposit;
            return (
              <div
                key={o.id}
                className="bg-white rounded-2xl border border-cream-200 shadow-soft p-4 cursor-pointer hover:border-strawberry-200 transition-colors"
                onClick={() => setSelected(o)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-display text-choco-600">
                        #{o.order_number}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${info.bg} ${info.color}`}
                      >
                        {info.label}
                      </span>
                      {o.settled && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pistachio-100 text-pistachio-600">
                          Liquidado
                        </span>
                      )}
                    </div>
                    {o.customer && (
                      <p className="text-sm text-choco-500 font-medium mt-1">
                        {o.customer.name}
                      </p>
                    )}
                    {o.items_summary && (
                      <p className="text-xs text-choco-400 mt-0.5 line-clamp-1">
                        {o.items_summary}
                      </p>
                    )}
                    {o.delivery_date && (
                      <p className="text-xs text-choco-400 mt-0.5">
                        Entrega: {formatDateTime(o.delivery_date)}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold font-display text-choco-600">
                      {formatCOP(o.total)}
                    </p>
                    {o.deposit > 0 && (
                      <p className="text-xs text-choco-400">
                        Abono {formatCOP(o.deposit)}
                      </p>
                    )}
                    {balance > 0 && !o.settled && (
                      <p className="text-xs text-red-500 font-bold">
                        Saldo {formatCOP(balance)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {creating && (
        <OrderForm
          customers={customers}
          onClose={() => setCreating(false)}
          onSaved={() => {
            reload();
            setCreating(false);
          }}
        />
      )}

      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onStatusChange={(s) => {
            updateStatus(selected, s);
            setSelected(null);
          }}
          onSettle={() => {
            settleOrder(selected);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

function OrderForm({
  customers,
  onClose,
  onSaved,
}: {
  customers: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [customerId, setCustomerId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [itemsSummary, setItemsSummary] = useState('');
  const [total, setTotal] = useState('');
  const [deposit, setDeposit] = useState('0');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const totalNum = parseInt(total || '0', 10);
    if (totalNum <= 0) {
      notify('error', 'El total debe ser mayor a 0.');
      return;
    }
    if (!itemsSummary.trim()) {
      notify('error', 'Describe los productos del pedido.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('orders').insert({
        customer_id: customerId || null,
        delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : null,
        total: totalNum,
        deposit: parseInt(deposit || '0', 10),
        items_summary: itemsSummary.trim(),
        notes: notes.trim() || null,
        status: 'pendiente',
      });
      if (error) throw error;
      notify('success', 'Pedido creado.');
      onSaved();
    } catch {
      notify('error', 'No se pudo crear el pedido.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Nuevo pedido" size="md">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-bold font-display text-choco-600 block mb-1">
            Cliente (opcional)
          </label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-cream-200 bg-cream-50 focus:border-strawberry-400 outline-none"
          >
            <option value="">Sin cliente</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-bold font-display text-choco-600 block mb-1">
            Productos y cantidades
          </label>
          <textarea
            value={itemsSummary}
            onChange={(e) => setItemsSummary(e.target.value)}
            rows={3}
            placeholder="2 tortas de helado, 10 malteadas grandes..."
            className="w-full px-3 py-2.5 rounded-xl border-2 border-cream-200 bg-cream-50 focus:border-strawberry-400 outline-none resize-none"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-bold font-display text-choco-600 block mb-1">
              Fecha de entrega
            </label>
            <input
              type="datetime-local"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-cream-200 bg-cream-50 focus:border-strawberry-400 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-bold font-display text-choco-600 block mb-1">
              Total (COP)
            </label>
            <input
              type="number"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-cream-200 bg-cream-50 focus:border-strawberry-400 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-bold font-display text-choco-600 block mb-1">
            Abono recibido (COP)
          </label>
          <input
            type="number"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-cream-200 bg-cream-50 focus:border-strawberry-400 outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-bold font-display text-choco-600 block mb-1">
            Observaciones
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-cream-200 bg-cream-50 focus:border-strawberry-400 outline-none resize-none"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={save} disabled={saving}>
            {saving ? 'Guardando...' : 'Crear pedido'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function OrderDetailModal({
  order,
  onClose,
  onStatusChange,
  onSettle,
}: {
  order: Order;
  onClose: () => void;
  onStatusChange: (status: OrderStatus) => void;
  onSettle: () => void;
}) {
  const info = STATUS_INFO[order.status];
  const balance = order.total - order.deposit;
  return (
    <Modal open onClose={onClose} title={`Pedido #${order.order_number}`} size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${info.bg} ${info.color}`}
          >
            {info.label}
          </span>
          {order.settled && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-pistachio-100 text-pistachio-600">
              Liquidado
            </span>
          )}
        </div>

        {order.customer && (
          <p className="text-sm text-choco-500">
            <span className="text-choco-400">Cliente:</span>{' '}
            <span className="font-semibold">{order.customer.name}</span>
          </p>
        )}
        {order.items_summary && (
          <div className="bg-cream-100 rounded-2xl p-3 text-sm text-choco-500 border border-cream-200">
            {order.items_summary}
          </div>
        )}
        {order.delivery_date && (
          <p className="text-sm text-choco-500">
            <span className="text-choco-400">Entrega:</span>{' '}
            {formatDateTime(order.delivery_date)}
          </p>
        )}
        {order.notes && (
          <p className="text-sm text-choco-500">
            <span className="text-choco-400">Notas:</span> {order.notes}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-cream-100 rounded-2xl p-3">
            <p className="text-xs text-choco-400 font-medium">Total</p>
            <p className="font-bold font-display text-choco-600">{formatCOP(order.total)}</p>
          </div>
          <div className="bg-cream-100 rounded-2xl p-3">
            <p className="text-xs text-choco-400 font-medium">Abono</p>
            <p className="font-bold font-display text-choco-600">{formatCOP(order.deposit)}</p>
          </div>
          <div
            className={`rounded-2xl p-3 ${balance > 0 && !order.settled ? 'bg-red-50' : 'bg-pistachio-50'}`}
          >
            <p className="text-xs text-choco-400 font-medium">Saldo</p>
            <p
              className={`font-bold font-display ${balance > 0 && !order.settled ? 'text-red-500' : 'text-pistachio-600'}`}
            >
              {formatCOP(Math.max(balance, 0))}
            </p>
          </div>
        </div>

        {order.status !== 'entregado' && order.status !== 'cancelado' && (
          <div>
            <p className="text-sm font-bold font-display text-choco-600 mb-2">
              Cambiar estado
            </p>
            <div className="flex gap-2 flex-wrap">
              {STATUS_FLOW.filter((s) => s !== order.status).map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className="px-3 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-sm font-semibold text-choco-500"
                >
                  {STATUS_INFO[s].label}
                </button>
              ))}
              <button
                onClick={() => onStatusChange('cancelado')}
                className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-sm font-semibold text-red-500"
              >
                Cancelar pedido
              </button>
            </div>
          </div>
        )}

        {balance > 0 && !order.settled && order.status !== 'cancelado' && (
          <div className="bg-butter-50 border border-butter-200 rounded-2xl p-3">
            <p className="text-sm text-choco-500 mb-2">
              Al liquidar, se registrará una venta por el saldo pendiente de{' '}
              <strong>{formatCOP(balance)}</strong> (no se duplica el abono).
            </p>
            <Button variant="success" className="w-full" onClick={onSettle}>
              <CheckCircle2 className="w-4 h-4" />
              Liquidar pedido
            </Button>
          </div>
        )}

        <Button variant="secondary" className="w-full" onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
          Imprimir
        </Button>
      </div>
    </Modal>
  );
}
