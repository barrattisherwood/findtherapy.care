export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  gaTrackingId: '', // Leave empty for development
  sentryDsn: '', // Leave empty to disable Sentry in development
  siteContactProxyUrl: 'http://localhost:3001/contact',
  providerContactProxyUrl: 'http://localhost:3001/provider-contact',
  turnstile: { siteKey: '1x00000000000000000000AA' }, // Cloudflare always-pass test key
  arclinkBlogBaseUrl: 'https://blog.arclink.dev',
  arclinkTenantId: '', // Fill in after running the Seed step in the Arclink admin dashboard
};
