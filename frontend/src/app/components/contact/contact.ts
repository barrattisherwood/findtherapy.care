import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [Navbar, Footer, FormsModule, RouterModule],
  templateUrl: './contact.html',
})
export class ContactComponent {
  name = signal('');
  email = signal('');
  subject = signal('');
  message = signal('');
  submitted = signal(false);
  loading = signal(false);

  async submitForm() {
    if (!this.name() || !this.email() || !this.subject() || !this.message()) {
      return;
    }

    this.loading.set(true);

    // TODO: Implement actual email sending
    // For now, just simulate submission
    setTimeout(() => {
      this.submitted.set(true);
      this.loading.set(false);
    }, 1000);
  }
}
