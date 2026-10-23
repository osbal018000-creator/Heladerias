import { useState, useEffect } from 'react';
import { POSScreen } from './components/POSScreen';
import { Dashboard } from './components/Dashboard';
import { ProductsAdmin } from './components/ProductsAdmin';
import { SalesAnalytics } from './components/SalesAnalytics';
import { Orders } from './components/Orders';
import { Customers } from './components/Customers';
import { Inventory } from './components/Inventory';
import { ToastContainer } from './components/Toast';
import {
  IceCream2,
  LayoutDashboard,
  Package,
  BarChart3,
  ClipboardList,
  Users,
  Boxes,
  Menu,
  X,
} from 'lucide-react';

type Tab =
  | 'pos'
  | 'dashboard'
  | 'analytics'
  | 'products'
  | 'orders'
  | 'customers'
  | 'inventory';

/**
 * Marca configurable. Define VITE_STORE_NAME y VITE_STORE_TAGLINE en tu .env
 * (o cambia los textos por defecto de aquí abajo).
 */
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
const BRAND = {
  name: env?.VITE_STORE_NAME || 'Heladería',
  tagline: env?.VITE_STORE_TAGLINE || 'Punto de venta',
};

const NAV: { id: Tab; label: string; icon: typeof IceCream2 }[] = [
  { id: 'pos', label: 'Vender', icon: IceCream2 },
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'analytics', label: 'Ventas', icon: BarChart3 },
  { id: 'products', label: 'Productos', icon: Package },
  { id: 'orders', label: 'Pedidos', icon: ClipboardList },
  { id: 'customers', label: 'Clientes', icon: Users },
  { id: 'inventory', label: 'Inventario', icon: Boxes },
];

/** Cono de helado dibujado en SVG: dos bolas (fresa y pistacho) sobre un cono de galleta. */
function ConeLogo() {
  return (
    <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
      <path d="M13 21h14l-7 16z" fill="#F4D987" />
      <path d="M16.5 25.5l7 0M18 30l4 0" stroke="#E0B95A" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="20" cy="15" r="8.5" fill="#FFFFFF" />
      <path
        d="M11.6 16.5C11.6 11.8 15.4 8 20 8s8.4 3.8 8.4 8.5c0 1.6-1.1 2.6-2.4 2.6-1.4 0-2-1.2-3.1-1.2s-1.7 1.2-2.9 1.2-1.8-1.2-2.9-1.2-1.7 1.2-3 1.2c-1.3 0-2.5-1-2.5-2.6z"
        fill="#FFFFFF"
      />
      <circle cx="20" cy="8.3" r="2.4" fill="#E96887" />
      <circle cx="16" cy="14" r="1" fill="#F7A8B8" />
      <circle cx="23.5" cy="13" r="1" fill="#B9CE91" />
      <circle cx="21" cy="16.5" r="0.9" fill="#F4D987" />
    </svg>
  );
}

function App() {
  const [tab, setTab] = useState<Tab>('pos');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [tab]);

  // Cierra el menú móvil con Escape
  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileNavOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen]);

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
      case 'customers':
        return <Customers />;
      case 'inventory':
        return <Inventory />;
    }
  };

  return (
    <div className="min-h-screen bg-cream-waves text-choco-600 flex flex-col">
      {/* Header */}
      <header className="bg-cream-50/90 backdrop-blur-md border-b border-cream-200 shadow-[0_1px_0_rgba(84,56,47,0.04),0_8px_24px_-16px_rgba(84,56,47,0.18)] sticky top-0 z-30 print:hidden">
        <div className="flex items-center justify-between px-4 h-16 max-w-[1600px] mx-auto">
          {/* Logo */}
          <button
            onClick={() => setTab('pos')}
            className="flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strawberry-400"
            aria-label={`${BRAND.name}: ir a Vender`}
          >
            <span className="w-10 h-10 rounded-2xl bg-strawberry-100 border border-strawberry-200 p-1 shadow-warm">
              <ConeLogo />
            </span>
            <span className="leading-none text-left">
              <span className="block font-display font-extrabold text-choco-600 text-base tracking-tight">
                {BRAND.name}
              </span>
              <span className="block text-[11px] text-choco-400 mt-1 font-semibold">
                {BRAND.tagline}
              </span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Principal">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = tab === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setTab(n.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`group flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-sm font-bold transition-colors duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strawberry-400 ${
                    active
                      ? 'bg-strawberry-100 text-strawberry-700'
                      : 'text-choco-400 hover:bg-cream-100 hover:text-choco-600'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150 ${
                      active
                        ? 'bg-strawberry-500 text-white'
                        : 'bg-cream-100 text-choco-400 group-hover:bg-cream-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={active ? 2.4 : 2} />
                  </span>
                  {n.label}
                </button>
              );
            })}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-expanded={mobileNavOpen}
            aria-label={mobileNavOpen ? 'Cerrar menú' : 'Abrir menú'}
            className="lg:hidden p-2 rounded-xl hover:bg-cream-100 text-choco-500 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strawberry-400"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileNavOpen && (
          <nav
            className="lg:hidden animate-tab-in border-t border-cream-200 bg-cream-50 px-3 py-3 grid grid-cols-2 gap-2"
            aria-label="Principal"
          >
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = tab === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setTab(n.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm font-bold border transition active:scale-[0.97] ${
                    active
                      ? 'bg-strawberry-100 border-strawberry-200 text-strawberry-700'
                      : 'bg-white border-cream-200 text-choco-500 hover:bg-cream-100'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      active ? 'bg-strawberry-500 text-white' : 'bg-cream-100 text-choco-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  {n.label}
                </button>
              );
            })}
          </nav>
        )}
      </header>

      {/* Content: key={tab} dispara una entrada breve (150 ms) al cambiar de módulo */}
      <main key={tab} className="flex-1 animate-tab-in print:block">
        {renderTab()}
      </main>

      {/* Mobile floating POS button */}
      {tab !== 'pos' && (
        <button
          onClick={() => setTab('pos')}
          className="lg:hidden fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 bg-strawberry-600 text-white rounded-full shadow-soft-lg w-14 h-14 flex items-center justify-center active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-strawberry-500 print:hidden"
          title="Vender"
          aria-label="Ir a Vender"
        >
          <IceCream2 className="w-6 h-6" />
        </button>
      )}

      <ToastContainer />
    </div>
  );
}

export default App;
