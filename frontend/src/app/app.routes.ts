import { Routes } from '@angular/router';

import { authGuard } from './guards/auth-guard';
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
  { path: '**', redirectTo: '' }
];
