import { Routes } from '@angular/router';

import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';
import { Landing } from './components/landing/landing';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { ResetPassword } from './components/reset-password/reset-password';
import { ProviderList } from './components/provider-list/provider-list';
import { ProviderDetail } from './components/provider-detail/provider-detail';
import { ProviderProfile } from './components/provider-profile/provider-profile';
import { SupportGroupList } from './components/support-group-list/support-group-list';
import { SupportGroupDetail } from './components/support-group-detail/support-group-detail';
import { SupportGroupForm } from './components/support-group-form/support-group-form';
import { CityLanding } from './components/city-landing/city-landing';
import { AdminDashboard } from './components/admin-dashboard/admin-dashboard';
import { BlogAdmin } from './components/blog-admin/blog-admin';
import { BlogEditor } from './components/blog-editor/blog-editor';
import { BlogList } from './components/blog-list/blog-list';
import { BlogDetail } from './components/blog-detail/blog-detail';
import { PrivacyComponent } from './components/privacy/privacy';
import { TermsComponent } from './components/terms/terms';
import { TermsOfService } from './components/terms-of-service/terms-of-service';
import { ContactComponent } from './components/contact/contact';

export const routes: Routes = [
  { path: '', component: Landing, title: 'findtherapy.care — Find therapists and counsellors near you' },
  // City landing pages
  { path: 'johannesburg', component: CityLanding, title: 'Therapists in Johannesburg — findtherapy.care' },
  { path: 'cape-town', component: CityLanding, title: 'Therapists in Cape Town — findtherapy.care' },
  { path: 'durban', component: CityLanding, title: 'Therapists in Durban — findtherapy.care' },
  { path: 'pretoria', component: CityLanding, title: 'Therapists in Pretoria — findtherapy.care' },
  { path: 'login', component: Login, title: 'Sign In — findtherapy.care' },
  { path: 'register', component: Register, title: 'Create Account — findtherapy.care' },
  { path: 'forgot-password', component: ForgotPassword, title: 'Reset Password — findtherapy.care' },
  { path: 'reset-password', component: ResetPassword, title: 'Reset Password — findtherapy.care' },
  // Provider routes
  { path: 'providers', component: ProviderList, title: 'Find Providers — findtherapy.care' },
  { path: 'providers/:id', component: ProviderDetail },
  { path: 'provider/profile', component: ProviderProfile, canActivate: [authGuard], title: 'My Profile — findtherapy.care' },
  // Support group routes
  { path: 'support-groups', component: SupportGroupList, title: 'Support Groups — findtherapy.care' },
  { path: 'support-groups/new', component: SupportGroupForm, canActivate: [authGuard], title: 'Create Support Group — findtherapy.care' },
  { path: 'support-groups/:id/edit', component: SupportGroupForm, canActivate: [authGuard], title: 'Edit Support Group — findtherapy.care' },
  { path: 'support-groups/:id', component: SupportGroupDetail },
  // Blog routes
  { path: 'blog', component: BlogList, title: 'Mental Health Blog — findtherapy.care' },
  { path: 'blog/:slug', component: BlogDetail },
  // Admin routes
  { path: 'admin/dashboard', component: AdminDashboard, canActivate: [adminGuard], title: 'Admin Dashboard — findtherapy.care' },
  { path: 'admin/blog', component: BlogAdmin, canActivate: [adminGuard], title: 'Blog Management — findtherapy.care' },
  { path: 'admin/blog/new', component: BlogEditor, canActivate: [adminGuard], title: 'New Blog Post — findtherapy.care' },
  { path: 'admin/blog/edit/:id', component: BlogEditor, canActivate: [adminGuard], title: 'Edit Blog Post — findtherapy.care' },
  // Legal pages
  { path: 'privacy', component: PrivacyComponent, title: 'Privacy Policy — findtherapy.care' },
  { path: 'terms', component: TermsComponent, title: 'Terms of Service — findtherapy.care' },
  { path: 'terms-of-service', component: TermsOfService, title: 'Terms of Service — findtherapy.care' },
  { path: 'contact', component: ContactComponent, title: 'Contact Us — findtherapy.care' },
  { path: '**', redirectTo: '' }
];
