import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Navbar } from '../../../components/navbar/navbar';
import { Footer } from '../../../components/footer/footer';
import { ProviderBlogService } from '../../../services/provider-blog.service';
import { MarkdownService } from '../../../services/markdown.service';
import { ToastService } from '../../../services/toast';

type EditorState = 'loading' | 'not-found' | 'brief' | 'review' | 'editing' | 'ready' | 'pending_review' | 'published';

@Component({
  selector: 'app-post-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Navbar, Footer],
  templateUrl: './post-editor.html',
})
export class PostEditor implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected blogService = inject(ProviderBlogService);
  protected markdownService = inject(MarkdownService);
  private toast = inject(ToastService);

  protected post = this.blogService.selectedPost;
  protected generating = this.blogService.generating;
  protected lastSocialCaption = this.blogService.lastSocialCaption;

  // Local UI state
  isEditing = signal(false);
  saving = signal(false);
  approving = signal(false);
  submitting = signal(false);

  // Editable fields (synced from post on load)
  editTitle = signal('');
  editBrief = signal('');
  editContent = signal('');

  protected editorState = computed((): EditorState => {
    const p = this.post();
    if (!p) return this.blogService.loading() ? 'loading' : 'not-found';
    if (p.status === 'published') return 'published';
    if (p.status === 'pending_review') return 'pending_review';
    if (p.providerApproved && p.status === 'draft') return 'ready';
    if (p.aiGenerated && !p.providerApproved && !this.isEditing()) return 'review';
    if (this.isEditing() || (p.content && !p.aiGenerated)) return 'editing';
    return 'brief';
  });

  protected generationLabel = computed(() => {
    const count = this.post()?.generationCount ?? 0;
    return `${count} of 5 generations used`;
  });

  protected canGenerate = computed(() => (this.post()?.generationCount ?? 0) < 5);

  protected renderedContent = computed(() => {
    const content = this.post()?.content ?? '';
    return content ? this.markdownService.render(content) : null;
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.blogService.selectedPostId.set(id);

    if (this.blogService.posts().length === 0) {
      this.blogService.loadPosts().subscribe({
        next: () => this.syncEditFields(),
        error: () => this.toast.show({ type: 'error', title: 'Error', message: 'Failed to load post.' }),
      });
    } else {
      this.syncEditFields();
    }
  }

  private syncEditFields() {
    const p = this.post();
    if (!p) return;
    this.editTitle.set(p.title);
    this.editBrief.set(p.brief ?? '');
    this.editContent.set(p.content ?? '');
  }

  generate() {
    const p = this.post();
    if (!p || !this.canGenerate()) return;
    this.blogService.generateContent(p._id).subscribe({
      next: () => {
        this.isEditing.set(false);
        if (this.lastSocialCaption()) {
          this.toast.show({ type: 'info', title: 'Content generated', message: 'Review and approve before submitting.' });
        }
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Generation failed. Please try again.';
        this.toast.show({ type: 'error', title: 'Generation failed', message: msg });
      },
    });
  }

  saveBrief() {
    const p = this.post();
    if (!p) return;
    this.saving.set(true);
    this.blogService.updatePost(p._id, {
      title: this.editTitle(),
      brief: this.editBrief(),
    }).subscribe({
      next: () => this.saving.set(false),
      error: () => {
        this.saving.set(false);
        this.toast.show({ type: 'error', title: 'Error', message: 'Failed to save.' });
      },
    });
  }

  saveContent() {
    const p = this.post();
    if (!p) return;
    this.saving.set(true);
    this.blogService.updatePost(p._id, { content: this.editContent() }).subscribe({
      next: () => {
        this.saving.set(false);
        this.syncEditFields();
      },
      error: () => {
        this.saving.set(false);
        this.toast.show({ type: 'error', title: 'Error', message: 'Failed to save.' });
      },
    });
  }

  approve() {
    const p = this.post();
    if (!p) return;
    this.approving.set(true);
    this.blogService.approvePost(p._id).subscribe({
      next: () => {
        this.approving.set(false);
        this.isEditing.set(false);
        this.toast.show({ type: 'success', title: 'Approved', message: 'Post approved and ready to submit.' });
      },
      error: () => {
        this.approving.set(false);
        this.toast.show({ type: 'error', title: 'Error', message: 'Failed to approve post.' });
      },
    });
  }

  submitForReview() {
    const p = this.post();
    if (!p) return;
    this.submitting.set(true);
    this.blogService.publishPost(p._id).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toast.show({ type: 'success', title: 'Submitted!', message: 'Your post is awaiting admin approval before going live.' });
      },
      error: (err) => {
        this.submitting.set(false);
        this.toast.show({ type: 'error', title: 'Error', message: err?.error?.message ?? 'Failed to submit post.' });
      },
    });
  }

  toggleSocialPlatform(platform: 'instagram' | 'facebook' | 'linkedin') {
    const p = this.post();
    if (!p) return;
    const inQueue = p.socialQueue.some(q => q.platform === platform);
    const action$ = inQueue
      ? this.blogService.removeFromSocialQueue(p._id, platform)
      : this.blogService.addToSocialQueue(p._id, platform);
    action$.subscribe({
      error: () => this.toast.show({ type: 'error', title: 'Error', message: 'Failed to update social queue.' }),
    });
  }

  isPlatformQueued(platform: string): boolean {
    return this.post()?.socialQueue.some(q => q.platform === platform) ?? false;
  }

  insertMarkdown(type: 'bold' | 'h2' | 'bullet', el: HTMLTextAreaElement) {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = el.value.substring(start, end);
    const before = el.value.substring(0, start);
    const after = el.value.substring(end);

    let inserted: string;
    switch (type) {
      case 'bold':   inserted = `**${selected || 'bold text'}**`; break;
      case 'h2':     inserted = `## ${selected || 'Heading'}`; break;
      case 'bullet': inserted = `- ${selected || 'list item'}`; break;
    }

    const newValue = before + inserted + after;
    el.value = newValue;
    this.editContent.set(newValue);
    el.focus();
    el.setSelectionRange(start + inserted.length, start + inserted.length);
  }
}
