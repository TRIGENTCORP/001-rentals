/**
 * Security utilities for CSRF protection and other security measures
 */

// Generate CSRF token
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Validate CSRF token
export const validateCSRFToken = (token: string): boolean => {
  // Basic validation - token should be 64 characters (32 bytes in hex)
  return typeof token === 'string' && token.length === 64 && /^[0-9a-f]+$/i.test(token);
};

// Store CSRF token in session storage
export const storeCSRFToken = (token: string): void => {
  try {
    sessionStorage.setItem('csrf_token', token);
  } catch (error) {
    // Handle storage errors silently
  }
};

// Retrieve CSRF token from session storage
export const getCSRFToken = (): string | null => {
  try {
    return sessionStorage.getItem('csrf_token');
  } catch (error) {
    return null;
  }
};

// Clear CSRF token
export const clearCSRFToken = (): void => {
  try {
    sessionStorage.removeItem('csrf_token');
  } catch (error) {
    // Handle storage errors silently
  }
};

// Initialize CSRF protection
export const initializeCSRFProtection = (): string => {
  const token = generateCSRFToken();
  storeCSRFToken(token);
  return token;
};

// Content Security Policy headers (for reference)
export const getCSPHeaders = (): Record<string, string> => {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: unsafe-eval needed for Vite in dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  };
};

// Rate limiting utility (simple in-memory implementation)
class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) { // 5 attempts per 15 minutes
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);

    if (!attempt || now > attempt.resetTime) {
      // Reset or create new attempt record
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (attempt.count >= this.maxAttempts) {
      return false;
    }

    attempt.count++;
    return true;
  }

  getRemainingAttempts(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt) return this.maxAttempts;
    return Math.max(0, this.maxAttempts - attempt.count);
  }

  getResetTime(identifier: string): number | null {
    const attempt = this.attempts.get(identifier);
    return attempt ? attempt.resetTime : null;
  }
}

// Export rate limiter instance
export const rateLimiter = new RateLimiter();

// Secure random string generator
export const generateSecureRandomString = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Hash function for sensitive data (simple implementation)
export const simpleHash = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};



