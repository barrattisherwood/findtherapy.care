# Reusable Starter Kit Reference

Source repo: https://github.com/barrattisherwood/kindredly

## Tech Stack
- Angular 19 (standalone components, signals)
- Node.js/Express backend
- MongoDB/Mongoose
- Tailwind CSS
- Monorepo with shared types package

## Reusable Frontend Components
- `frontend/src/app/components/cookie-consent/` - GDPR banner
- `frontend/src/app/components/forgot-password/` - Password reset request
- `frontend/src/app/components/reset-password/` - Password reset form
- `frontend/src/app/components/login/` - Login form
- `frontend/src/app/components/register/` - Registration form
- `frontend/src/app/components/toast-container/` - Toast notifications
- `frontend/src/app/components/loading-skeleton/` - Loading states
- `frontend/src/app/components/navbar/` - Navigation bar

## Reusable Frontend Services/Utils
- `frontend/src/app/services/auth.service.ts` - Auth state management
- `frontend/src/app/services/toast.ts` - Toast service
- `frontend/src/app/guards/auth-guard.ts` - Route protection
- `frontend/src/app/interceptors/auth.interceptor.ts` - JWT injection
- `frontend/src/app/interceptors/error.interceptor.ts` - Error handling
- `frontend/src/environments/` - Environment config

## Reusable Backend
- `backend/src/controllers/authController.ts` - Auth endpoints (login, register, password reset)
- `backend/src/middleware/auth.ts` - JWT middleware
- `backend/src/models/User.ts` - User model (adapt fields for new app)
- `backend/src/routes/authRoutes.ts` - Auth routes
- `backend/src/services/emailService.ts` - Email service with dev-mode console logging
- `backend/src/server.ts` - Express setup with CORS, MongoDB connection

## Config Files to Copy
- `frontend/tailwind.config.js` - Tailwind configuration
- `frontend/src/styles.scss` - Global styles and Tailwind imports
- Root `package.json` - Scripts structure for monorepo
- `shared/` - Shared types package structure

## Key Patterns Used
- Standalone Angular components (no NgModules)
- Angular signals for state management
- JWT stored in localStorage
- HTTP interceptors for auth headers and error handling
- Environment-based API URL configuration
- Password reset with token hashing and expiry
