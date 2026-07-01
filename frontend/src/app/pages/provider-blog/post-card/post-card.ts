import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProviderBlogPost } from '@findlocal/shared';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white border border-gray-200 rounded-xl p-5 flex items-start justify-between gap-4 hover:border-gray-300 transition-colors">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 mb-1">
          <span [class]="statusClass">{{ statusLabel }}</span>
          @if (post.aiGenerated) {
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              AI
            </span>
          }
        </div>
        <h3 class="font-semibold text-gray-900 truncate">{{ post.title }}</h3>
        @if (post.brief) {
          <p class="text-sm text-gray-500 mt-0.5 line-clamp-1">{{ post.brief }}</p>
        }
        <p class="text-xs text-gray-400 mt-1.5">{{ formatDate(post.updatedAt) }}</p>
      </div>
      <button
        (click)="open.emit()"
        class="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-[#2D9B9B] border border-[#2D9B9B] rounded-lg hover:bg-teal-50 transition-colors"
      >
        Open
      </button>
    </div>
  `,
})
export class PostCard {
  @Input({ required: true }) post!: ProviderBlogPost;
  @Output() open = new EventEmitter<void>();

  get statusLabel(): string {
    const labels: Record<string, string> = {
      draft: 'Draft',
      pending_review: 'Under Review',
      published: 'Published',
      scheduled: 'Scheduled',
      archived: 'Archived',
    };
    return labels[this.post.status] ?? this.post.status;
  }

  get statusClass(): string {
    const classes: Record<string, string> = {
      draft: 'inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600',
      pending_review: 'inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700',
      published: 'inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700',
      scheduled: 'inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700',
      archived: 'inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400',
    };
    return classes[this.post.status] ?? classes['draft'];
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
