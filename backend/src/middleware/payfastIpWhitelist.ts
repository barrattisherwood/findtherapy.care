import { Request, Response, NextFunction } from 'express';

// PayFast server IP ranges (CIDR notation)
// Source: https://developers.payfast.co.za/docs#step_4_confirm_payment_source
const PAYFAST_IP_RANGES = [
  '197.97.145.144/28',   // 197.97.145.144 - 197.97.145.159
  '41.74.179.192/27',    // 41.74.179.192 - 41.74.179.223
  '102.216.36.0/24',     // 102.216.36.0 - 102.216.36.255
];

/**
 * Convert CIDR notation to IP range
 */
function cidrToRange(cidr: string): { start: number; end: number } {
  const [ip, bits] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);
  const ipNum = ipToNumber(ip);
  const start = ipNum & mask;
  const end = start + ~mask;
  return { start, end };
}

/**
 * Convert IP address string to number
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/**
 * Check if IP is in any of the PayFast ranges
 */
function isPayFastIp(ip: string): boolean {
  // Handle IPv6 localhost
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  }

  // Strip IPv6 prefix if present
  const cleanIp = ip.replace(/^::ffff:/, '');

  // Allow localhost in development/test
  if (cleanIp === '127.0.0.1') {
    return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  }

  const ipNum = ipToNumber(cleanIp);

  for (const cidr of PAYFAST_IP_RANGES) {
    const range = cidrToRange(cidr);
    if (ipNum >= range.start && ipNum <= range.end) {
      return true;
    }
  }

  return false;
}

/**
 * Get client IP from request, considering proxies
 */
function getClientIp(req: Request): string {
  // Check x-forwarded-for header (for proxied requests)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = typeof forwarded === 'string' ? forwarded : forwarded[0];
    return ips.split(',')[0].trim();
  }

  // Check x-real-ip header
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return typeof realIp === 'string' ? realIp : realIp[0];
  }

  // Fall back to socket remote address
  return req.socket.remoteAddress || '';
}

/**
 * Middleware to verify requests come from PayFast servers
 * Bypassed in development/test environments for local testing
 */
export function payfastIpWhitelist(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const clientIp = getClientIp(req);

  // Bypass in test/development environments
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
    next();
    return;
  }

  if (!isPayFastIp(clientIp)) {
    console.warn(`PayFast ITN rejected from unauthorized IP: ${clientIp}`);
    res.status(403).send('Forbidden');
    return;
  }

  next();
}

// Export for testing
export { isPayFastIp, getClientIp, cidrToRange, ipToNumber };
