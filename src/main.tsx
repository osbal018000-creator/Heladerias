import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const root = createRoot(document.getElementById('root')!);

const missingEnv =
  !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

if (missingEnv) {
  // En vez de dejar la pantalla en blanco, explica qué falta.
  root.render(
    <div className="min-h-screen bg-cream-waves flex items-center justify-center p-6">
      <div className="max-w-md bg-white border border-cream-200 rounded-3xl shadow-soft-md p-6 text-center">
        <h1 className="font-display font-extrabold text-xl text-choco-600">
          Falta configurar la conexión
        </h1>
        <p className="text-sm text-choco-400 mt-2">
          Define <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>{' '}
          en las variables de entorno (Netlify → Site configuration → Environment
          variables) y vuelve a desplegar.
        </p>
      </div>
    </div>,
  );
} else {
  // Import dinámico: supabase.ts solo se evalúa si las variables existen.
  import('./App.tsx').then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
}
