import { Routes } from '@angular/router';

import { authGuard } from './guards/auth-guard';
import { Landing } from './components/landing/landing';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { ResetPassword } from './components/reset-password/reset-password';
import { Dashboard } from './components/dashboard/dashboard';
import { ProviderList } from './components/provider-list/provider-list';
import { ProviderDetail } from './components/provider-detail/provider-detail';
import { ProviderProfile } from './components/provider-profile/provider-profile';
import { SupportGroupList } from './components/support-group-list/support-group-list';
import { SupportGroupDetail } from './components/support-group-detail/support-group-detail';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'reset-password', component: ResetPassword },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  // Provider routes
  { path: 'providers', component: ProviderList },
  { path: 'providers/:id', component: ProviderDetail },
  { path: 'provider/profile', component: ProviderProfile, canActivate: [authGuard] },
  // Support group routes
  { path: 'support-groups', component: SupportGroupList },
  { path: 'support-groups/:id', component: SupportGroupDetail },
  { path: '**', redirectTo: '' }
];
