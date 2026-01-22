import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-skeleton.html',
  styleUrl: './loading-skeleton.scss'
})
export class LoadingSkeleton {
  @Input() type: 'card' | 'text' | 'avatar' | 'button' = 'text';
  @Input() count = 1;
  @Input() width = '100%';
  @Input() height = '1rem';

  get items(): number[] {
    return Array(this.count).fill(0).map((_, i) => i);
  }
}
