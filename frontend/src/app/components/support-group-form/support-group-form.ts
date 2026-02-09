import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SupportGroupService } from '../../services/support-group.service';
import { AuthService } from '../../services/auth.service';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { SUPPORT_GROUP_CATEGORIES, MeetingType } from '@findlocal/shared';

@Component({
  selector: 'app-support-group-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Navbar, Footer],
  templateUrl: './support-group-form.html',
  styleUrl: './support-group-form.scss'
})
export class SupportGroupForm implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private supportGroupService = inject(SupportGroupService);
  private authService = inject(AuthService);

  form: FormGroup;
  loading = this.supportGroupService.loading;
  errorMessage = '';
  successMessage = '';
  isEditMode = false;
  supportGroupId: string | null = null;

  categories = SUPPORT_GROUP_CATEGORIES;
  meetingTypes: MeetingType[] = ['in-person', 'online', 'hybrid'];

  constructor() {
    // Check if user is admin
    const user = this.authService.currentUser();
    if (!user?.isAdmin) {
      this.router.navigate(['/']);
      throw new Error('Unauthorized');
    }

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      category: ['', Validators.required],
      meetingType: ['', Validators.required],
      city: ['', Validators.required],
      address: [''],
      meetingSchedule: [''],
      contactEmail: ['', Validators.email],
      contactPhone: [''],
      website: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    // Check if we're editing an existing support group
    this.supportGroupId = this.route.snapshot.paramMap.get('id');
    if (this.supportGroupId) {
      this.isEditMode = true;
      this.loadSupportGroup();
    }
  }

  loadSupportGroup(): void {
    if (!this.supportGroupId) return;

    this.supportGroupService.getById(this.supportGroupId).subscribe({
      next: (response) => {
        const group = response.supportGroup;
        this.form.patchValue({
          name: group.name,
          description: group.description,
          category: group.category,
          meetingType: group.meetingType,
          city: group.location?.city || '',
          address: group.location?.address || '',
          meetingSchedule: group.meetingSchedule || '',
          contactEmail: group.contactEmail || '',
          contactPhone: group.contactPhone || '',
          website: group.website || '',
          isActive: group.isActive
        });
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to load support group';
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.form.value;
    const data = {
      name: formValue.name,
      description: formValue.description,
      category: formValue.category,
      meetingType: formValue.meetingType,
      location: {
        city: formValue.city,
        address: formValue.address || undefined
      },
      meetingSchedule: formValue.meetingSchedule || undefined,
      contactEmail: formValue.contactEmail || undefined,
      contactPhone: formValue.contactPhone || undefined,
      website: formValue.website || undefined,
      isActive: formValue.isActive
    };

    if (this.isEditMode && this.supportGroupId) {
      // Update existing support group
      this.supportGroupService.update(this.supportGroupId, data).subscribe({
        next: () => {
          this.successMessage = 'Support group updated successfully!';
          setTimeout(() => this.router.navigate(['/support-groups']), 2000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to update support group';
        }
      });
    } else {
      // Create new support group
      this.supportGroupService.create(data).subscribe({
        next: () => {
          this.successMessage = 'Support group created successfully!';
          setTimeout(() => this.router.navigate(['/support-groups']), 2000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to create support group';
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/support-groups']);
  }
}
