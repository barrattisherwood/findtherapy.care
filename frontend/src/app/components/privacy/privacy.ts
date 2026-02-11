import { Component } from '@angular/core';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [Navbar, Footer],
  templateUrl: './privacy.html',
})
export class PrivacyComponent {
  lastUpdated = 'February 11, 2026';
}
