import { useToast } from '@/lib/toast';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const styles =
          t.kind === 'success'
            ? 'bg-pistachio-500 border-pistachio-600'
            : t.kind === 'error'
              ? 'bg-red-500 border-red-600'
              : 'bg-strawberry-500 border-strawberry-600';
        const Icon =
          t.kind === 'success'
            ? CheckCircle2
            : t.kind === 'error'
              ? XCircle
              : Info;
        return (
          <div
            key={t.id}
            className={`${styles} text-white rounded-2xl shadow-soft-md px-4 py-3 flex items-start gap-3 border animate-slideIn`}
          >
            <Icon className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
