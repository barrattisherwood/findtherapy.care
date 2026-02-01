import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupportGroupService } from '../../services/support-group.service';
import { SeoService } from '../../services/seo.service';
import { SupportGroupCard } from '../support-group-card/support-group-card';
import { LoadingSkeleton } from '../loading-skeleton/loading-skeleton';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { MeetingType, SupportGroupSearchParams } from '@findlocal/shared';
import { SUPPORT_GROUP_CATEGORIES } from '@findlocal/shared';

@Component({
  selector: 'app-support-group-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SupportGroupCard, LoadingSkeleton, Navbar, Footer],
  templateUrl: './support-group-list.html',
  styleUrl: './support-group-list.scss'
})
export class SupportGroupList implements OnInit {
  private supportGroupService = inject(SupportGroupService);
  private seo = inject(SeoService);

  supportGroups = this.supportGroupService.supportGroups;
  loading = this.supportGroupService.loading;
  totalSupportGroups = this.supportGroupService.totalSupportGroups;
  currentPage = this.supportGroupService.currentPage;
  totalPages = this.supportGroupService.totalPages;

  // Filter values
  selectedCategory = signal<string>('');
  selectedCity = signal<string>('');
  selectedMeetingType = signal<MeetingType | ''>('');

  categories = SUPPORT_GROUP_CATEGORIES;

  ngOnInit(): void {
    this.seo.update({
      title: 'Support Groups',
      description: 'Find mental health support groups across South Africa. Browse by category, city, and meeting type to connect with community support.',
      url: '/support-groups',
    });
    this.search();
  }

  search(): void {
    const params: SupportGroupSearchParams = {
      page: 1,
      limit: 12,
    };

    if (this.selectedCategory()) params.category = this.selectedCategory();
    if (this.selectedCity()) params.city = this.selectedCity();
    if (this.selectedMeetingType()) params.meetingType = this.selectedMeetingType() as MeetingType;

    this.supportGroupService.search(params).subscribe();
  }

  loadPage(page: number): void {
    const params: SupportGroupSearchParams = {
      page,
      limit: 12,
    };

    if (this.selectedCategory()) params.category = this.selectedCategory();
    if (this.selectedCity()) params.city = this.selectedCity();
    if (this.selectedMeetingType()) params.meetingType = this.selectedMeetingType() as MeetingType;

    this.supportGroupService.search(params).subscribe();
  }

  clearFilters(): void {
    this.selectedCategory.set('');
    this.selectedCity.set('');
    this.selectedMeetingType.set('');
    this.search();
  }

  onCategoryChange(value: string): void {
    this.selectedCategory.set(value);
    this.search();
  }

  onCityChange(value: string): void {
    this.selectedCity.set(value);
  }

  onMeetingTypeChange(value: string): void {
    this.selectedMeetingType.set(value as MeetingType | '');
    this.search();
  }
}
