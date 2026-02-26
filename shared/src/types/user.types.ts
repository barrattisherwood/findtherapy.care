export interface User {
  id: string;
  email: string;
  isAdmin?: boolean;
  emailVerified?: boolean;
  profile?: {
    bio?: string;
    avatar?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MessageResponse {
  message: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  promoCode?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}
