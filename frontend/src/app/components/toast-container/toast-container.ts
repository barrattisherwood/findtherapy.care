import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.scss'
})
export class ToastContainer {
  toasts;
  closingToasts = signal<Set<number>>(new Set());

  constructor(private toastService: ToastService) {
    this.toasts = this.toastService.toasts;
    this.toastService.getDismissHandler = (id: number) => this.dismiss(id);
  }

  dismiss(id: number): void {
    if (this.closingToasts().has(id)) {
      return;
    }

    this.closingToasts.update(set => {
      const newSet = new Set(set);
      newSet.add(id);
      return newSet;
    });

    setTimeout(() => {
      this.toastService.dismiss(id);
      this.closingToasts.update(set => {
        const newSet = new Set(set);
        newSet.delete(id);
        return newSet;
      });
    }, 300);
  }

  isClosing(id: number): boolean {
    return this.closingToasts().has(id);
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '•';
    }
  }

  getStyles(type: string): string {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-500 text-green-900';
      case 'error': return 'bg-red-50 border-red-500 text-red-900';
      case 'warning': return 'bg-yellow-50 border-yellow-500 text-yellow-900';
      case 'info': return 'bg-blue-50 border-blue-500 text-blue-900';
      default: return 'bg-gray-50 border-gray-500 text-gray-900';
    }
  }

  getIconStyles(type: string): string {
    switch (type) {
      case 'success': return 'bg-green-500 text-white';
      case 'error': return 'bg-red-500 text-white';
      case 'warning': return 'bg-yellow-500 text-white';
      case 'info': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  }
}
