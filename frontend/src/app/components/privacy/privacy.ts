import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './privacy.html',
})
export class PrivacyComponent {
  lastUpdated = 'February 11, 2026';
}
