import { useState, useEffect } from 'react';
import { POSScreen } from './components/POSScreen';
import { Dashboard } from './components/Dashboard';
import { ProductsAdmin } from './components/ProductsAdmin';
import { SalesAnalytics } from './components/SalesAnalytics';
import { Orders } from './components/Orders';
import { ToastContainer } from './components/Toast';
import {
  IceCream2,
  LayoutDashboard,
  Package,
  BarChart3,
  ClipboardList,
  Menu,
  X,
} from 'lucide-react';

type Tab = 'pos' | 'dashboard' | 'analytics' | 'products' | 'orders';

const NAV: { id: Tab; label: string; icon: typeof IceCream2 }[] = [
  { id: 'pos', label: 'Vender', icon: IceCream2 },
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'analytics', label: 'Ventas', icon: BarChart3 },
  { id: 'products', label: 'Productos', icon: Package },
  { id: 'orders', label: 'Pedidos', icon: ClipboardList },
];

function App() {
  const [tab, setTab] = useState<Tab>('pos');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [tab]);

  const renderTab = () => {
    switch (tab) {
      case 'pos':
        return <POSScreen onNavigate={(t) => setTab(t as Tab)} />;
      case 'dashboard':
        return <Dashboard onNavigate={(t) => setTab(t as Tab)} />;
      case 'analytics':
        return <SalesAnalytics />;
      case 'products':
        return <ProductsAdmin onNavigate={(t) => setTab(t as Tab)} />;
      case 'orders':
        return <Orders />;
    }
  };

  return (
    <div className="min-h-screen bg-cream-waves text-choco-600 flex flex-col">
      {/* Header */}
      <header className="bg-cream-50/95 backdrop-blur-sm border-b border-cream-200 sticky top-0 z-30 print:hidden">
        <div className="flex items-center justify-between px-4 h-16 max-w-[1600px] mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-strawberry-400 to-strawberry-500 flex items-center justify-center shadow-warm">
              <IceCream2 className="w-5.5 h-5.5 text-white" strokeWidth={2.2} />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-pistachio-300 border-2 border-cream-50" />
            </div>
            <div className="leading-none">
              <h1 className="font-display font-extrabold text-choco-600 text-[15px]">
                Heladería
              </h1>
              <p className="text-[10px] text-choco-400 mt-0.5 font-medium tracking-wide">
                Punto de venta
              </p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = tab === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setTab(n.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-strawberry-100 text-strawberry-600'
                      : 'text-choco-400 hover:bg-cream-100 hover:text-choco-600'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={active ? 2.4 : 2} />
                  {n.label}
                </button>
              );
            })}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileNavOpen((v) => !v)}
            className="lg:hidden p-2 rounded-xl hover:bg-cream-100 text-choco-500"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileNavOpen && (
          <nav className="lg:hidden border-t border-cream-200 bg-cream-50 px-3 py-2 grid grid-cols-2 gap-1">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = tab === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setTab(n.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                    active
                      ? 'bg-strawberry-100 text-strawberry-600'
                      : 'text-choco-400 hover:bg-cream-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {n.label}
                </button>
              );
            })}
          </nav>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 print:block">{renderTab()}</main>

      {/* Mobile floating POS button */}
      {tab !== 'pos' && (
        <button
          onClick={() => setTab('pos')}
          className="lg:hidden fixed bottom-4 right-4 z-40 bg-strawberry-500 text-white rounded-full shadow-warm w-14 h-14 flex items-center justify-center active:scale-95 transition-transform print:hidden"
          title="Vender"
        >
          <IceCream2 className="w-6 h-6" />
        </button>
      )}

      <ToastContainer />
    </div>
  );
}

export default App;
