import { useToasts } from "../../lib/toast";
import type { Toast } from "../../lib/toast";

const meta: Record<string, { icon: string; cls: string }> = {
  success: { icon: "✓", cls: "bg-[#22c55e] border-[#16a34a] text-white" },
  error:   { icon: "✕", cls: "bg-danger border-danger/80 text-white" },
  info:    { icon: "ℹ", cls: "bg-brand border-brand/80 text-brand-fg" },
};

function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: () => void }) {
  const { icon, cls } = meta[t.type] ?? meta.info!;
  return (
    <div
      className={`flex items-center gap-3 min-w-[240px] max-w-[380px] px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${cls}`}
      style={{ animation: "toast-in 180ms ease-out" }}
    >
      <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
        {icon}
      </span>
      <span className="flex-1 leading-snug">{t.message}</span>
      <button onClick={onDismiss} className="shrink-0 opacity-70 hover:opacity-100 ml-1">✕</button>
    </div>
  );
}

export function Toaster() {
  const [toasts, dismiss] = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.slice(-3).map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem t={t} onDismiss={() => dismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}
