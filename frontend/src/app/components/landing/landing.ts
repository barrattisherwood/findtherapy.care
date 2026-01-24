import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class Landing implements OnInit, OnDestroy {
  currentYear = new Date().getFullYear();

  // Hero images for the carousel - place images in assets/images/hero/
  heroImages = [
    'assets/images/hero/hero-1.jpg',
    'assets/images/hero/hero-2.jpg',
    'assets/images/hero/hero-3.jpg',
  ];

  currentImageIndex = signal(0);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    // Auto-advance carousel every 6 seconds
    this.intervalId = setInterval(() => {
      this.nextImage();
    }, 6000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  nextImage(): void {
    this.currentImageIndex.update(i => (i + 1) % this.heroImages.length);
  }

  goToImage(index: number): void {
    this.currentImageIndex.set(index);
  }
}
