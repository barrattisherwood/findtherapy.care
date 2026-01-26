// Contact Form Types

export interface ContactProviderRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface ContactProviderResponse {
  success: boolean;
  message: string;
}
