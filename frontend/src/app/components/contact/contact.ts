import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, Navbar, Footer, FormsModule, RouterModule],
  templateUrl: './contact.html',
})
export class ContactComponent {
  private http = inject(HttpClient);

  name = signal('');
  email = signal('');
  subject = signal('');
  message = signal('');
  submitted = signal(false);
  loading = signal(false);
  error = signal('');

  async submitForm() {
    if (!this.name() || !this.email() || !this.subject() || !this.message()) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      await this.http.post(`${environment.apiUrl}/contact`, {
        name: this.name(),
        email: this.email(),
        subject: this.subject(),
        message: this.message(),
      }).toPromise();

      this.submitted.set(true);
    } catch (err: any) {
      console.error('Contact form error:', err);
      this.error.set(err.error?.message || 'Failed to send message. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
