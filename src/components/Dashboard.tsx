import { useMemo } from 'react';
import { useSales, useOrders } from '@/lib/hooks';
import { formatCOP, formatCOPShort, isSameDay } from '@/lib/format';
import { Card } from './Card';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Clock,
  IceCream2,
  ArrowRight,
} from 'lucide-react';

interface Props {
  onNavigate: (tab: string) => void;
}

export function Dashboard({ onNavigate }: Props) {
  const { sales, loading } = useSales();
  const { orders } = useOrders();

  const stats = useMemo(() => {
    const today = new Date();
    const todaySales = sales.filter((s) => isSameDay(new Date(s.created_at), today));
    const todayTotal = todaySales.reduce((s, x) => s + x.total, 0);
    const todayUnits = todaySales.reduce(
      (s, x) => s + (x.sale_items?.reduce((a, i) => a + i.quantity, 0) ?? 0),
      0,
    );

    const allTimeTotal = sales.reduce((s, x) => s + x.total, 0);

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const productCount: Record<string, number> = {};
    sales
      .filter((s) => new Date(s.created_at) >= since)
      .forEach((s) =>
        s.sale_items?.forEach((i) => {
          productCount[i.product_name] =
            (productCount[i.product_name] ?? 0) + i.quantity;
        }),
      );
    const topProduct =
      Object.entries(productCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

    const last7: { label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const total = sales
        .filter((s) => isSameDay(new Date(s.created_at), d))
        .reduce((sum, x) => sum + x.total, 0);
      last7.push({
        label: d.toLocaleDateString('es-CO', { weekday: 'short' }),
        total,
      });
    }
    const maxDay = Math.max(...last7.map((d) => d.total), 1);

    const pendingOrders = orders.filter(
      (o) => o.status !== 'entregado' && o.status !== 'cancelado',
    );

    return {
      todayTotal,
      todayCount: todaySales.length,
      todayUnits,
      allTimeTotal,
      topProduct,
      last7,
      maxDay,
      pendingOrders,
    };
  }, [sales, orders]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-strawberry-200 border-t-strawberry-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const noSales = sales.length === 0;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold font-display text-choco-600">Panel de inicio</h1>
        <p className="text-sm text-choco-400 mt-0.5">
          Resumen del día y novedades del negocio
        </p>
      </div>

      {noSales && (
        <div className="bg-butter-50 border border-butter-200 rounded-2xl px-4 py-3 text-sm text-choco-500 font-medium">
          Aún no has registrado ventas. Usa el punto de venta para crear tu primera
          transacción y verla reflejada aquí.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-choco-400 font-semibold">Ventas de hoy</p>
              <p className="text-xl sm:text-2xl font-bold font-display text-choco-600 mt-1">
                {formatCOP(stats.todayTotal)}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-strawberry-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-strawberry-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-choco-400 font-semibold">Transacciones hoy</p>
              <p className="text-xl sm:text-2xl font-bold font-display text-choco-600 mt-1">
                {stats.todayCount}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-butter-100 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-butter-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-choco-400 font-semibold">Unidades hoy</p>
              <p className="text-xl sm:text-2xl font-bold font-display text-choco-600 mt-1">
                {stats.todayUnits}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-strawberry-100 flex items-center justify-center">
              <IceCream2 className="w-5 h-5 text-strawberry-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-choco-400 font-semibold">Total histórico</p>
              <p className="text-xl sm:text-2xl font-bold font-display text-choco-600 mt-1">
                {formatCOPShort(stats.allTimeTotal)}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-pistachio-100 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-pistachio-500" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold font-display text-choco-600">
              Ventas últimos 7 días
            </h3>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-strawberry-500 font-bold hover:text-strawberry-600 flex items-center gap-1"
            >
              Ver estadísticas <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-end justify-between gap-2 h-40">
            {stats.last7.map((d, i) => (
              <div
                key={i}
                className="flex-1 min-w-0 flex flex-col items-center gap-2 group"
              >
                <span className="text-[10px] text-choco-500 font-bold whitespace-nowrap">
                  {formatCOPShort(d.total)}
                </span>
                <div className="w-full h-28 bg-cream-100 rounded-t-xl relative flex items-end overflow-hidden">
                  <div
                    className="w-full bg-gradient-to-t from-strawberry-500 to-strawberry-300 rounded-t-xl transition-all group-hover:from-strawberry-600 group-hover:to-strawberry-400"
                    style={{
                      height: d.total > 0 ? `${Math.max((d.total / stats.maxDay) * 100, 8)}%` : '3%',
                    }}
                  />
                </div>
                <span className="text-xs text-choco-400 capitalize font-medium truncate max-w-full">
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-butter-400" />
            <h3 className="font-bold font-display text-choco-600 text-sm">
              Pedidos pendientes
            </h3>
          </div>
          {stats.pendingOrders.length === 0 ? (
            <p className="text-sm text-choco-400">Sin pedidos pendientes.</p>
          ) : (
            <div className="space-y-2">
              {stats.pendingOrders.slice(0, 4).map((o) => (
                <div
                  key={o.id}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-choco-500 font-medium">#{o.order_number}</span>
                  <span className="font-bold font-display text-choco-600">
                    {formatCOP(o.total)}
                  </span>
                </div>
              ))}
              <button
                onClick={() => onNavigate('orders')}
                className="text-xs text-strawberry-500 font-bold hover:text-strawberry-600 flex items-center gap-1"
              >
                Ver todos ({stats.pendingOrders.length}) <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </Card>
      </div>

      <div className="pt-2">
        <button
          onClick={() => onNavigate('pos')}
          className="w-full bg-gradient-to-r from-strawberry-500 to-strawberry-400 hover:from-strawberry-600 hover:to-strawberry-500 text-white font-bold font-display py-4 rounded-2xl shadow-warm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <IceCream2 className="w-5 h-5" />
          Ir al punto de venta
        </button>
      </div>
    </div>
  );
}
