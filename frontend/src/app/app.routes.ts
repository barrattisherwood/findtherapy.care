import { Routes } from '@angular/router';

import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';
import { providerBlogGuard } from './guards/provider-blog-guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/landing/landing').then(m => m.Landing), title: 'findtherapy.care — Find therapists and counsellors near you' },
  // City landing pages
  { path: 'johannesburg', loadComponent: () => import('./components/city-landing/city-landing').then(m => m.CityLanding), title: 'Therapists in Johannesburg — findtherapy.care' },
  { path: 'cape-town', loadComponent: () => import('./components/city-landing/city-landing').then(m => m.CityLanding), title: 'Therapists in Cape Town — findtherapy.care' },
  { path: 'durban', loadComponent: () => import('./components/city-landing/city-landing').then(m => m.CityLanding), title: 'Therapists in Durban — findtherapy.care' },
  { path: 'pretoria', loadComponent: () => import('./components/city-landing/city-landing').then(m => m.CityLanding), title: 'Therapists in Pretoria — findtherapy.care' },
  { path: 'login', loadComponent: () => import('./components/login/login').then(m => m.Login), title: 'Sign In — findtherapy.care' },
  { path: 'register', loadComponent: () => import('./components/register/register').then(m => m.Register), title: 'Create Account — findtherapy.care' },
  { path: 'founders', loadComponent: () => import('./components/founders/founders').then(m => m.Founders), title: 'Founding Supporter Deal — findtherapy.care' },
  { path: 'forgot-password', loadComponent: () => import('./components/forgot-password/forgot-password').then(m => m.ForgotPassword), title: 'Reset Password — findtherapy.care' },
  { path: 'reset-password', loadComponent: () => import('./components/reset-password/reset-password').then(m => m.ResetPassword), title: 'Reset Password — findtherapy.care' },
  { path: 'verify-email', loadComponent: () => import('./components/verify-email/verify-email').then(m => m.VerifyEmail), title: 'Verify Email — findtherapy.care' },
  // Provider routes
  { path: 'providers', loadComponent: () => import('./components/provider-list/provider-list').then(m => m.ProviderList), title: 'Find Providers — findtherapy.care' },
  { path: 'providers/:id', loadComponent: () => import('./components/provider-detail/provider-detail').then(m => m.ProviderDetail) },
  { path: 'provider/profile', loadComponent: () => import('./components/provider-profile/provider-profile').then(m => m.ProviderProfile), canActivate: [authGuard], title: 'My Profile — findtherapy.care' },
  // Support group routes
  { path: 'support-groups', loadComponent: () => import('./components/support-group-list/support-group-list').then(m => m.SupportGroupList), title: 'Support Groups — findtherapy.care' },
  { path: 'support-groups/new', loadComponent: () => import('./components/support-group-form/support-group-form').then(m => m.SupportGroupForm), canActivate: [authGuard], title: 'Create Support Group — findtherapy.care' },
  { path: 'support-groups/:id/edit', loadComponent: () => import('./components/support-group-form/support-group-form').then(m => m.SupportGroupForm), canActivate: [authGuard], title: 'Edit Support Group — findtherapy.care' },
  { path: 'support-groups/:id', loadComponent: () => import('./components/support-group-detail/support-group-detail').then(m => m.SupportGroupDetail) },
  // Blog routes
  { path: 'blog', loadComponent: () => import('./components/blog-list/blog-list').then(m => m.BlogList), title: 'Mental Health Blog — findtherapy.care' },
  { path: 'blog/:slug', loadComponent: () => import('./components/blog-detail/blog-detail').then(m => m.BlogDetail) },
  // Provider blog routes (beta)
  { path: 'provider/blog', canActivate: [authGuard, providerBlogGuard], loadComponent: () => import('./pages/provider-blog/provider-blog').then(m => m.ProviderBlog), title: 'My Blog — findtherapy.care' },
  { path: 'provider/blog/:id', canActivate: [authGuard, providerBlogGuard], loadComponent: () => import('./pages/provider-blog/post-editor/post-editor').then(m => m.PostEditor), title: 'Edit Post — findtherapy.care' },
  // Admin routes
  { path: 'admin/dashboard', loadComponent: () => import('./components/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard), canActivate: [adminGuard], title: 'Admin Dashboard — findtherapy.care' },
  { path: 'admin/vetting', loadComponent: () => import('./components/admin-vetting/admin-vetting').then(m => m.AdminVetting), canActivate: [adminGuard], title: 'Provider Vetting — findtherapy.care' },
  { path: 'admin/providers', loadComponent: () => import('./components/admin-providers/admin-providers').then(m => m.AdminProviders), canActivate: [adminGuard], title: 'Provider Management — findtherapy.care' },
  { path: 'admin/messages', loadComponent: () => import('./components/admin-messages/admin-messages').then(m => m.AdminMessages), canActivate: [adminGuard], title: 'Messages — findtherapy.care' },
  { path: 'admin/logs', loadComponent: () => import('./components/admin-logs/admin-logs').then(m => m.AdminLogs), canActivate: [adminGuard], title: 'Activity Log — findtherapy.care' },
  { path: 'admin/blog', loadComponent: () => import('./components/blog-admin/blog-admin').then(m => m.BlogAdmin), canActivate: [adminGuard], title: 'Blog Management — findtherapy.care' },
  { path: 'admin/feature-flags', loadComponent: () => import('./components/admin-feature-flags/admin-feature-flags').then(m => m.AdminFeatureFlags), canActivate: [adminGuard], title: 'Feature Flags — findtherapy.care' },
  { path: 'admin/blog/pending', loadComponent: () => import('./components/admin-blog-pending/admin-blog-pending').then(m => m.AdminBlogPending), canActivate: [adminGuard], title: 'Pending Blog Review — findtherapy.care' },
  { path: 'admin/blog/new', loadComponent: () => import('./components/blog-editor/blog-editor').then(m => m.BlogEditor), canActivate: [adminGuard], title: 'New Blog Post — findtherapy.care' },
  { path: 'admin/blog/edit/:id', loadComponent: () => import('./components/blog-editor/blog-editor').then(m => m.BlogEditor), canActivate: [adminGuard], title: 'Edit Blog Post — findtherapy.care' },
  // Legal pages
  { path: 'privacy', loadComponent: () => import('./components/privacy/privacy').then(m => m.PrivacyComponent), title: 'Privacy Policy — findtherapy.care' },
  { path: 'terms', loadComponent: () => import('./components/terms/terms').then(m => m.TermsComponent), title: 'Terms of Service — findtherapy.care' },
  { path: 'terms-of-service', loadComponent: () => import('./components/terms-of-service/terms-of-service').then(m => m.TermsOfService), title: 'Terms of Service — findtherapy.care' },
  { path: 'contact', loadComponent: () => import('./components/contact/contact').then(m => m.ContactComponent), title: 'Contact Us — findtherapy.care' },
  { path: '**', redirectTo: '' }
];
