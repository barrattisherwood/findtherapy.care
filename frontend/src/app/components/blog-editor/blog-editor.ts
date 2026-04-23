import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SafeHtml } from '@angular/platform-browser';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { BlogService } from '../../services/blog.service';
import { MarkdownService } from '../../services/markdown.service';
import { ProviderService } from '../../services/provider.service';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { BlogPost, CreateBlogPostRequest, UpdateBlogPostRequest, Provider } from '@findlocal/shared';

@Component({
  selector: 'app-blog-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Navbar, Footer],
  templateUrl: './blog-editor.html',
  styleUrl: './blog-editor.scss'
})
export class BlogEditor implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private blogService = inject(BlogService);
  private markdownService = inject(MarkdownService);
  private providerService = inject(ProviderService);
  private destroy$ = new Subject<void>();
  private authorSearch$ = new Subject<string>();

  isEditing = signal(false);
  postId = signal<string | null>(null);
  loading = this.blogService.loading;
  errorMessage = signal('');
  successMessage = signal('');
  previewMode = signal(false);
  markdownPreview = signal<SafeHtml>('');

  // Author provider linking
  authorQuery = signal('');
  authorSuggestions = signal<Pick<Provider, 'id' | 'displayName' | 'profileImage'>[]>([]);
  showAuthorSuggestions = signal(false);
  linkedProviderId = signal<string | null>(null);

  blogForm: FormGroup;
  featuredImageFile = signal<File | null>(null);
  featuredImagePreview = signal<string | null>(null);

  constructor() {
    this.blogForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      content: ['', [Validators.required]],
      excerpt: ['', [Validators.required, Validators.maxLength(300)]],
      featuredImage: [''],
      status: ['draft', [Validators.required]],
      scheduledFor: [''],
      categories: [''],
      tags: [''],
      seoTitle: ['', [Validators.maxLength(60)]],
      seoDescription: ['', [Validators.maxLength(160)]],
      authorDisplayName: ['Staff writer'],
      commentsEnabled: [true]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditing.set(true);
      this.postId.set(id);
      this.loadPost(id);
    }

    this.authorSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => q.length >= 2 ? this.providerService.adminSearch(q) : of({ providers: [] })),
      takeUntil(this.destroy$),
    ).subscribe(res => {
      this.authorSuggestions.set(res.providers ?? []);
      this.showAuthorSuggestions.set((res.providers ?? []).length > 0);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onAuthorQueryChange(q: string): void {
    this.authorQuery.set(q);
    this.linkedProviderId.set(null);
    this.blogForm.patchValue({ authorDisplayName: q || 'Staff writer' });
    this.authorSearch$.next(q);
  }

  selectAuthorProvider(p: Pick<Provider, 'id' | 'displayName' | 'profileImage'>): void {
    this.linkedProviderId.set(p.id);
    this.authorQuery.set(p.displayName);
    this.blogForm.patchValue({ authorDisplayName: p.displayName });
    this.authorSuggestions.set([]);
    this.showAuthorSuggestions.set(false);
  }

  clearAuthorProvider(): void {
    this.linkedProviderId.set(null);
    this.authorQuery.set('');
    this.blogForm.patchValue({ authorDisplayName: 'Staff writer' });
    this.authorSuggestions.set([]);
  }

  loadPost(id: string): void {
    this.blogService.getAdminBlogPostById(id).subscribe({
      next: (post) => {
        this.populateForm(post);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Failed to load blog post');
      }
    });
  }

  populateForm(post: BlogPost): void {
    this.blogForm.patchValue({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      status: post.status,
      scheduledFor: post.scheduledFor ? new Date(post.scheduledFor).toISOString().slice(0, 16) : '',
      categories: post.categories.join(', '),
      tags: post.tags.join(', '),
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
      authorDisplayName: post.authorDisplayName ?? 'Staff writer',
      commentsEnabled: post.commentsEnabled
    });

    if (post.featuredImage) {
      this.featuredImagePreview.set(post.featuredImage);
    }

    if (post.authorProviderId) {
      this.linkedProviderId.set(post.authorProviderId);
      this.authorQuery.set(post.authorDisplayName ?? '');
    } else {
      const name = post.authorDisplayName ?? '';
      this.authorQuery.set(name === 'Staff writer' ? '' : name);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        this.errorMessage.set('Please select a valid image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        this.errorMessage.set('Image file must be less than 5MB');
        return;
      }

      this.featuredImageFile.set(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.featuredImagePreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeFeaturedImage(): void {
    this.featuredImageFile.set(null);
    this.featuredImagePreview.set(null);
    this.blogForm.patchValue({ featuredImage: '' });
  }

  generateExcerpt(): void {
    const content = this.blogForm.get('content')?.value;
    if (content && !this.blogForm.get('excerpt')?.value) {
      const excerpt = this.markdownService.generateExcerpt(content, 300);
      this.blogForm.patchValue({ excerpt });
    }
  }

  togglePreview(): void {
    const newMode = !this.previewMode();
    this.previewMode.set(newMode);
    if (newMode) {
      this.updatePreview();
    }
  }

  updatePreview(): void {
    const content = this.blogForm.get('content')?.value || '';
    this.markdownPreview.set(this.markdownService.render(content));
  }

  generateSeoTitle(): void {
    const title = this.blogForm.get('title')?.value;
    if (title && !this.blogForm.get('seoTitle')?.value) {
      const seoTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;
      this.blogForm.patchValue({ seoTitle });
    }
  }

  onSubmit(): void {
    if (this.blogForm.valid) {
      this.savePost('draft');
    } else {
      this.markFormGroupTouched();
    }
  }

  onPublish(): void {
    if (this.blogForm.valid) {
      this.savePost('published');
    } else {
      this.markFormGroupTouched();
    }
  }

  onSchedule(): void {
    if (this.blogForm.valid) {
      const scheduledFor = this.blogForm.get('scheduledFor')?.value;
      if (!scheduledFor) {
        this.errorMessage.set('Please select a date and time to schedule the post');
        return;
      }
      this.savePost('scheduled');
    } else {
      this.markFormGroupTouched();
    }
  }

  private async savePost(status: 'draft' | 'published' | 'scheduled'): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      let featuredImageUrl = this.blogForm.get('featuredImage')?.value;

      // Upload featured image if a new file was selected
      if (this.featuredImageFile()) {
        const uploadResult = await this.blogService.uploadFeaturedImage(this.featuredImageFile()!).toPromise();
        featuredImageUrl = uploadResult?.url;
      }

      const formValue = this.blogForm.value;
      const postData = {
        title: formValue.title,
        content: formValue.content,
        excerpt: formValue.excerpt,
        featuredImage: featuredImageUrl,
        status,
        scheduledFor: status === 'scheduled' ? new Date(formValue.scheduledFor) : undefined,
        categories: formValue.categories ? formValue.categories.split(',').map((c: string) => c.trim()).filter(Boolean) : [],
        tags: formValue.tags ? formValue.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        seoTitle: formValue.seoTitle,
        seoDescription: formValue.seoDescription,
        authorDisplayName: formValue.authorDisplayName || 'Staff writer',
        authorProviderId: this.linkedProviderId() ?? undefined,
        commentsEnabled: formValue.commentsEnabled
      };

      if (this.isEditing()) {
        await this.blogService.updateBlogPost(this.postId()!, postData as UpdateBlogPostRequest).toPromise();
        this.successMessage.set('Blog post updated successfully!');
      } else {
        await this.blogService.createBlogPost(postData as CreateBlogPostRequest).toPromise();
        this.successMessage.set('Blog post created successfully!');
      }

      // Navigate back to blog admin after short delay
      setTimeout(() => {
        this.router.navigate(['/admin/blog']);
      }, 2000);

    } catch (error: any) {
      this.errorMessage.set(error.error?.message || 'Failed to save blog post');
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.blogForm.controls).forEach(key => {
      this.blogForm.get(key)?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.blogForm.get(fieldName);
    return !!(field?.invalid && (field?.dirty || field?.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.blogForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['maxlength']) return `${fieldName} is too long`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
    }
    return '';
  }

  cancel(): void {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      this.router.navigate(['/admin/blog']);
    }
  }
}