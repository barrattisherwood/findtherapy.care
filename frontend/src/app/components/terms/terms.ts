import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './terms.html',
})
export class TermsComponent {
  lastUpdated = 'February 11, 2026';
}
