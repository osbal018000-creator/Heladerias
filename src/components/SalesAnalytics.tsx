import { useState, useMemo, useRef, useEffect } from 'react';
import { useSales, useOrders } from '@/lib/hooks';
import { formatCOP, formatCOPShort, formatDateTime, isSameDay } from '@/lib/format';
import { exportSalesCSV, exportSalesExcel, exportOrdersCSV } from '@/lib/export';
import { useToast } from '@/lib/toast';
import { Card } from './Card';
import { Modal } from './Modal';
import { Button } from './Button';
import type { Sale } from '@/lib/types';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Receipt,
  Wallet,
  Printer,
  Download,
  FileSpreadsheet,
} from 'lucide-react';

type Range = 'today' | '7d' | '30d' | 'all';

export function SalesAnalytics() {
  const { sales } = useSales();
  const { orders } = useOrders();
  const toast = useToast((s) => s.notify);
  const [range, setRange] = useState<Range>('today');
  const [selected, setSelected] = useState<Sale | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    const start = new Date();
    if (range === 'today') start.setHours(0, 0, 0, 0);
    else if (range === '7d') start.setDate(now.getDate() - 7);
    else if (range === '30d') start.setDate(now.getDate() - 30);
    else return sales;
    return sales.filter((s) => new Date(s.created_at) >= start);
  }, [sales, range]);

  const stats = useMemo(() => {
    const total = filtered.reduce((s, x) => s + x.total, 0);
    const count = filtered.length;
    const units = filtered.reduce(
      (s, x) => s + (x.sale_items?.reduce((a, i) => a + i.quantity, 0) ?? 0),
      0,
    );
    const avg = count ? total / count : 0;

    let totalCost = 0;
    filtered.forEach((s) =>
      s.sale_items?.forEach((i) => {
        totalCost += (i.cost ?? 0) * i.quantity;
      }),
    );
    const margin = total - totalCost;
    const hasCost = totalCost > 0;

    const productCount: Record<string, { qty: number; revenue: number }> = {};
    filtered.forEach((s) =>
      s.sale_items?.forEach((i) => {
        if (!productCount[i.product_name])
          productCount[i.product_name] = { qty: 0, revenue: 0 };
        productCount[i.product_name].qty += i.quantity;
        productCount[i.product_name].revenue += i.subtotal;
      }),
    );
    const topProducts = Object.entries(productCount)
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 5);

    const methodCount: Record<string, { count: number; total: number }> = {};
    filtered.forEach((s) => {
      if (!methodCount[s.payment_method])
        methodCount[s.payment_method] = { count: 0, total: 0 };
      methodCount[s.payment_method].count++;
      methodCount[s.payment_method].total += s.total;
    });
    const methods = Object.entries(methodCount).sort(
      (a, b) => b[1].total - a[1].total,
    );

    const days: { label: string; total: number; date: Date }[] = [];
    const numDays = range === 'today' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 14;
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const total = sales
        .filter((s) => isSameDay(new Date(s.created_at), d))
        .reduce((sum, x) => sum + x.total, 0);
      days.push({
        label: d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' }),
        total,
        date: d,
      });
    }
    const maxDay = Math.max(...days.map((d) => d.total), 1);

    return {
      total,
      count,
      units,
      avg,
      margin,
      hasCost,
      topProducts,
      methods,
      days,
      maxDay,
    };
  }, [filtered, sales, range]);

  const methodLabels: Record<string, string> = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    tarjeta: 'Tarjeta',
    otro: 'Otro',
  };

  const handleExportSales = () => {
    if (filtered.length === 0) {
      toast('error', 'No hay ventas para exportar en este período.');
      return;
    }
    const label = range === 'today' ? 'hoy' : range === '7d' ? '7dias' : range === '30d' ? '30dias' : 'total';
    exportSalesCSV(filtered, label);
    toast('success', `Se exportaron ${filtered.length} ventas.`);
  };

  const handleExportExcel = () => {
    if (filtered.length === 0) {
      toast('error', 'No hay ventas para exportar en este período.');
      return;
    }
    const label = range === 'today' ? 'hoy' : range === '7d' ? '7dias' : range === '30d' ? '30dias' : 'total';
    exportSalesExcel(filtered, label);
    setExportOpen(false);
    toast('success', `Se exportaron ${filtered.length} ventas a Excel.`);
  };

  const handleExportOrders = () => {
    if (orders.length === 0) {
      toast('error', 'No hay pedidos para exportar.');
      return;
    }
    exportOrdersCSV(orders);
    toast('success', `Se exportaron ${orders.length} pedidos con abonos.`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display text-choco-600">Análisis de ventas</h1>
          <p className="text-sm text-choco-400 mt-0.5">
            Estadísticas e historial de transacciones
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5 bg-cream-100 rounded-2xl p-1 border border-cream-200">
            {(
              [
                ['today', 'Hoy'],
                ['7d', '7 días'],
                ['30d', '30 días'],
                ['all', 'Todo'],
              ] as [Range, string][]
            ).map(([r, label]) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3.5 py-1.5 rounded-xl text-sm font-bold transition-all ${
                  range === r ? 'bg-white text-strawberry-600 shadow-soft' : 'text-choco-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen((open) => !open)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-cream-200 text-choco-500 font-semibold text-sm hover:border-strawberry-300 hover:text-strawberry-600 transition-all shadow-soft"
              aria-haspopup="menu"
              aria-expanded={exportOpen}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar ventas</span>
              <span className="text-xs">▾</span>
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-cream-200 bg-white p-1.5 shadow-warm z-20" role="menu">
                <button
                  onClick={() => { handleExportSales(); setExportOpen(false); }}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-choco-500 hover:bg-cream-100"
                  role="menuitem"
                >
                  <Download className="w-4 h-4 text-strawberry-500" />
                  CSV
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-choco-500 hover:bg-cream-100"
                  role="menuitem"
                >
                  <FileSpreadsheet className="w-4 h-4 text-pistachio-500" />
                  Excel (.xls)
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleExportOrders}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-cream-200 text-choco-500 font-semibold text-sm hover:border-pistachio-300 hover:text-pistachio-600 transition-all shadow-soft"
            title="Exportar pedidos y abonos en CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Pedidos y abonos</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <TrendingUp className="w-5 h-5 text-strawberry-500 mb-2" />
          <p className="text-xs text-choco-400 font-semibold">Ingresos</p>
          <p className="text-xl font-bold font-display text-choco-600">
            {formatCOP(stats.total)}
          </p>
          {stats.hasCost && (
            <p className="text-xs text-pistachio-600 mt-1 font-semibold">
              Utilidad: {formatCOP(stats.margin)}
            </p>
          )}
          {!stats.hasCost && stats.count > 0 && (
            <p className="text-xs text-choco-400 mt-1">Utilidad no disponible</p>
          )}
        </Card>
        <Card>
          <ShoppingBag className="w-5 h-5 text-butter-400 mb-2" />
          <p className="text-xs text-choco-400 font-semibold">Transacciones</p>
          <p className="text-xl font-bold font-display text-choco-600">{stats.count}</p>
        </Card>
        <Card>
          <Package className="w-5 h-5 text-choco-400 mb-2" />
          <p className="text-xs text-choco-400 font-semibold">Unidades vendidas</p>
          <p className="text-xl font-bold font-display text-choco-600">{stats.units}</p>
        </Card>
        <Card>
          <Receipt className="w-5 h-5 text-pistachio-500 mb-2" />
          <p className="text-xs text-choco-400 font-semibold">Venta promedio</p>
          <p className="text-xl font-bold font-display text-choco-600">
            {formatCOP(stats.avg)}
          </p>
        </Card>
      </div>

      {stats.hasCost && (
        <div className="bg-butter-50 border border-butter-200 rounded-2xl px-4 py-3 text-sm text-choco-500 font-medium">
          Los ingresos son el total vendido. La utilidad mostrada es un margen
          bruto estimado a partir de los costos registrados.
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-bold font-display text-choco-600 mb-4">
            Ventas por día
          </h3>
          <div className="flex items-end gap-1 h-44 overflow-x-auto">
            {stats.days.map((d, i) => (
              <div
                key={i}
                className="flex-1 min-w-[34px] flex flex-col items-center gap-1 group"
              >
                <span className="text-[9px] text-choco-500 whitespace-nowrap font-bold">
                  {formatCOPShort(d.total)}
                </span>
                <div className="w-full h-32 bg-cream-100 rounded-t-lg flex items-end overflow-hidden">
                  <div
                    className="w-full bg-gradient-to-t from-strawberry-500 to-strawberry-300 rounded-t-lg group-hover:from-strawberry-600 transition-all"
                    style={{
                      height: d.total > 0 ? `${Math.max((d.total / stats.maxDay) * 100, 8)}%` : '3%',
                    }}
                  />
                </div>
                <span className="text-[9px] text-choco-400 whitespace-nowrap">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-bold font-display text-choco-600 mb-4">
            Métodos de pago
          </h3>
          {stats.methods.length === 0 ? (
            <p className="text-sm text-choco-400">Sin datos.</p>
          ) : (
            <div className="space-y-3">
              {stats.methods.map(([method, data]) => {
                const pct = stats.total ? (data.total / stats.total) * 100 : 0;
                return (
                  <div key={method}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-choco-500 font-semibold">
                        {methodLabels[method] ?? method}
                      </span>
                      <span className="text-choco-400">
                        {formatCOP(data.total)} · {data.count} ventas
                      </span>
                    </div>
                    <div className="h-2.5 bg-cream-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-strawberry-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="font-bold font-display text-choco-600 mb-4">
          Productos más vendidos
        </h3>
        {stats.topProducts.length === 0 ? (
          <p className="text-sm text-choco-400">Sin ventas en este período.</p>
        ) : (
          <div className="space-y-2">
            {stats.topProducts.map(([name, data], i) => (
              <div
                key={name}
                className="flex items-center gap-3 py-2 border-b border-cream-100 last:border-0"
              >
                <span className="w-7 h-7 rounded-full bg-strawberry-100 text-strawberry-600 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-semibold text-choco-500 truncate">
                  {name}
                </span>
                <span className="text-sm text-choco-400">
                  {data.qty} und.
                </span>
                <span className="text-sm font-bold font-display text-choco-600 w-24 text-right">
                  {formatCOP(data.revenue)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="font-bold font-display text-choco-600 mb-4">
          Historial de ventas ({filtered.length})
        </h3>
        {filtered.length === 0 ? (
          <p className="text-sm text-choco-400">No hay ventas en este período.</p>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {filtered.slice(0, 100).map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-cream-100 text-left transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-strawberry-100 text-strawberry-500 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-choco-600">
                      {formatDateTime(s.created_at)}
                    </p>
                    <p className="text-xs text-choco-400">
                      {s.sale_items?.length ?? 0} artículos ·{' '}
                      {methodLabels[s.payment_method] ?? s.payment_method}
                    </p>
                  </div>
                </div>
                <span className="font-bold font-display text-choco-600 shrink-0">
                  {formatCOP(s.total)}
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>

      {selected && (
        <SaleDetailModal sale={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function SaleDetailModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const methodLabels: Record<string, string> = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    tarjeta: 'Tarjeta',
    otro: 'Otro',
  };
  return (
    <Modal open onClose={onClose} title="Detalle de venta" size="md">
      <div className="space-y-4">
        <div className="text-center pb-3 border-b border-cream-200">
          <p className="text-xs text-choco-400 font-medium">Fecha</p>
          <p className="font-bold font-display text-choco-600">
            {formatDateTime(sale.created_at)}
          </p>
        </div>
        <div className="space-y-2">
          {sale.sale_items?.map((item) => (
            <div
              key={item.id}
              className="flex justify-between text-sm py-1.5 border-b border-cream-100 last:border-0"
            >
              <div>
                <span className="font-semibold text-choco-500">
                  {item.quantity}× {item.product_name}
                </span>
                {item.toppings_names && item.toppings_names.length > 0 && (
                  <p className="text-xs text-choco-400 ml-4">
                    + {item.toppings_names.join(', ')}
                  </p>
                )}
              </div>
              <span className="font-semibold text-choco-600">
                {formatCOP(item.subtotal)}
              </span>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 pt-3 border-t border-cream-200">
          <div className="flex justify-between text-sm">
            <span className="text-choco-400">Método de pago</span>
            <span className="font-semibold text-choco-600">
              {methodLabels[sale.payment_method] ?? sale.payment_method}
            </span>
          </div>
          {sale.amount_received != null && (
            <div className="flex justify-between text-sm">
              <span className="text-choco-400">Recibido</span>
              <span className="font-semibold text-choco-600">
                {formatCOP(sale.amount_received)}
              </span>
            </div>
          )}
          {sale.change != null && sale.change > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-choco-400">Cambio</span>
              <span className="font-semibold text-choco-600">
                {formatCOP(sale.change)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold font-display pt-2">
            <span className="text-choco-600">Total</span>
            <span className="text-choco-600">{formatCOP(sale.total)}</span>
          </div>
        </div>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4" />
          Imprimir recibo
        </Button>
      </div>
    </Modal>
  );
}
