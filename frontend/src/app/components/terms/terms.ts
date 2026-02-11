import { Component } from '@angular/core';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [Navbar, Footer],
  templateUrl: './terms.html',
})
export class TermsComponent {
  lastUpdated = 'February 11, 2026';
}
