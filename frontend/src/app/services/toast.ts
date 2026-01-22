import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);
  private nextId = 0;
  private maxToasts = 5;

  public getDismissHandler?: (id: number) => void;

  show(toast: Omit<Toast, 'id'>): void {
    const id = this.nextId++;
    const newToast: Toast = { id, ...toast };

    this.toasts.update(toasts => {
      const updated = [...toasts, newToast];

      if (updated.length > this.maxToasts) {
        const toRemove = updated.slice(0, updated.length - this.maxToasts);
        toRemove.forEach(t => {
          if (this.getDismissHandler) {
            this.getDismissHandler(t.id);
          } else {
            this.dismiss(t.id);
          }
        });
      }

      return updated;
    });

    const duration = toast.duration ?? 4000;
    setTimeout(() => {
      if (this.getDismissHandler) {
        this.getDismissHandler(id);
      } else {
        this.dismiss(id);
      }
    }, duration);
  }

  success(title: string, message: string, duration?: number): void {
    this.show({ type: 'success', title, message, duration });
  }

  error(title: string, message: string, duration?: number): void {
    this.show({ type: 'error', title, message, duration });
  }

  info(title: string, message: string, duration?: number): void {
    this.show({ type: 'info', title, message, duration });
  }

  warning(title: string, message: string, duration?: number): void {
    this.show({ type: 'warning', title, message, duration });
  }

  dismiss(id: number): void {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }
}
