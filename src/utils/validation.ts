/**
 * Input validation and sanitization utilities
 */

// HTML sanitization
export const sanitizeHtml = (input: string): string => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

// Text sanitization (removes potentially dangerous characters)
export const sanitizeText = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone number validation
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

// Order ID validation (flexible format - alphanumeric with common separators)
export const isValidOrderId = (orderId: string): boolean => {
  // Allow alphanumeric characters, dashes, underscores, and dots
  // Length between 3 and 50 characters
  const orderIdRegex = /^[A-Za-z0-9\-_\.]{3,50}$/;
  return orderIdRegex.test(orderId);
};

// UUID validation
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Number validation
export const isValidNumber = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && isFinite(num) && num >= 0;
};

// Positive integer validation
export const isValidPositiveInteger = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  return Number.isInteger(num) && num > 0;
};

// String length validation
export const isValidLength = (input: string, min: number, max: number): boolean => {
  return input.length >= min && input.length <= max;
};

// XSS prevention - escape HTML entities
export const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// SQL injection prevention (basic)
export const sanitizeForDatabase = (input: string): string => {
  return input
    .replace(/['";\\]/g, '') // Remove potentially dangerous characters
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove SQL block comments start
    .replace(/\*\//g, '') // Remove SQL block comments end
    .trim();
};

// Validate and sanitize user input
export const validateAndSanitizeInput = (input: string, type: 'text' | 'email' | 'phone' | 'orderId' | 'uuid'): { isValid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeText(input);
  
  switch (type) {
    case 'text':
      if (!isValidLength(sanitized, 1, 255)) {
        return { isValid: false, sanitized, error: 'Text must be between 1 and 255 characters' };
      }
      break;
    case 'email':
      if (!isValidEmail(sanitized)) {
        return { isValid: false, sanitized, error: 'Invalid email format' };
      }
      break;
    case 'phone':
      if (!isValidPhone(sanitized)) {
        return { isValid: false, sanitized, error: 'Invalid phone number format' };
      }
      break;
    case 'orderId':
      if (!isValidOrderId(sanitized)) {
        return { isValid: false, sanitized, error: 'Invalid order ID format' };
      }
      break;
    case 'uuid':
      if (!isValidUUID(sanitized)) {
        return { isValid: false, sanitized, error: 'Invalid UUID format' };
      }
      break;
  }
  
  return { isValid: true, sanitized };
};
