/* Pega esto en tu index.css (después de las directivas @tailwind) */
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=Nunito+Sans:wght@400;600;700;800&display=swap');

html {
  font-family: 'Nunito Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Fondo: crema vainilla con dos destellos suaves y una onda de crema al pie.
   Es solo background-image: no intercepta clics ni compite con el contenido. */
.bg-cream-waves {
  background-color: #fff8ec;
  background-image:
    radial-gradient(520px 320px at 8% -4%, rgba(247, 168, 184, 0.22), transparent 70%),
    radial-gradient(480px 300px at 100% 12%, rgba(185, 206, 145, 0.20), transparent 70%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 160' preserveAspectRatio='none'%3E%3Cpath d='M0 90c120 40 240 40 360 10s240-50 360-30 240 60 360 50 240-50 360-30v110H0z' fill='%23F4D987' fill-opacity='.22'/%3E%3Cpath d='M0 120c140 30 260 20 380-5s260-30 380-10 220 40 300 30 240-30 380-10v35H0z' fill='%23F7A8B8' fill-opacity='.18'/%3E%3C/svg%3E");
  background-repeat: no-repeat, no-repeat, no-repeat;
  background-position: top left, top right, bottom center;
  background-size: auto, auto, 100% 140px;
  background-attachment: fixed;
}

/* Cambio de módulo / apertura de menú: breve, no bloquea clics */
@keyframes tab-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-tab-in { animation: tab-in 150ms ease-out both; }

/* Útil para el contador del carrito y la confirmación al agregar un producto */
@keyframes pop {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.18); }
  100% { transform: scale(1); }
}
.animate-pop { animation: pop 180ms ease-out; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
