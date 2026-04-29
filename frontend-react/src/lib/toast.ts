import { useSyncExternalStore } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

class ToastStore {
  private toasts: Toast[] = [];
  private listeners = new Set<() => void>();

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  };

  getSnapshot = () => this.toasts;

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  add(message: string, type: ToastType = "success") {
    const id = Math.random().toString(36).slice(2, 9);
    this.toasts = [...this.toasts, { id, message, type }];
    this.notify();
    setTimeout(() => this.remove(id), 3500);
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }
}

const store = new ToastStore();

export const toast = {
  success: (msg: string) => store.add(msg, "success"),
  error: (msg: string) => store.add(msg, "error"),
  info: (msg: string) => store.add(msg, "info"),
};

export function useToasts(): [Toast[], (id: string) => void] {
  const toasts = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return [toasts, (id) => store.remove(id)];
}
