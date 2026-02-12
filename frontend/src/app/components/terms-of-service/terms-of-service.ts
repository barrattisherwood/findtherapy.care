import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Footer } from '../footer/footer';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [CommonModule, Footer, Navbar],
  templateUrl: './terms-of-service.html',
  styleUrl: './terms-of-service.scss'
})
export class TermsOfService {
  currentYear = new Date().getFullYear();
  lastUpdated = 'February 2026';
  showScrollToTop = false;

  ngOnInit() {
    window.addEventListener('scroll', this.onScroll.bind(this));
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.onScroll.bind(this));
  }

  onScroll() {
    this.showScrollToTop = window.pageYOffset > 300;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
