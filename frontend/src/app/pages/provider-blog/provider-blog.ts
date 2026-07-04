import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';
import { ProviderBlogService } from '../../services/provider-blog.service';
import { ToastService } from '../../services/toast';
import { PostCard } from './post-card/post-card';

@Component({
  selector: 'app-provider-blog',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Footer, PostCard],
  templateUrl: './provider-blog.html',
})
export class ProviderBlog implements OnInit {
  private router = inject(Router);
  protected blogService = inject(ProviderBlogService);
  private toast = inject(ToastService);

  showNewPostForm = signal(false);
  creating = signal(false);
  newTitle = '';

  ngOnInit() {
    this.blogService.loadPosts().subscribe({
      error: () => this.toast.show({ type: 'error', title: 'Error', message: 'Failed to load your posts.' }),
    });
  }

  openPost(id: string) {
    this.blogService.selectedPostId.set(id);
    this.router.navigate(['/provider/blog', id]);
  }

  submitNewPost() {
    if (!this.newTitle.trim()) return;
    this.creating.set(true);
    this.blogService.createDraft({ title: this.newTitle.trim(), brief: '' }).subscribe({
      next: (post) => {
        this.creating.set(false);
        this.showNewPostForm.set(false);
        this.newTitle = '';
        this.blogService.selectedPostId.set(post._id);
        this.router.navigate(['/provider/blog', post._id]);
      },
      error: () => {
        this.creating.set(false);
        this.toast.show({ type: 'error', title: 'Error', message: 'Failed to create post. Please try again.' });
      },
    });
  }

  cancelNewPost() {
    this.showNewPostForm.set(false);
    this.newTitle = '';
  }
}
