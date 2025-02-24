interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  blocked: boolean;
}

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const rateLimitMap = new Map<string, RateLimitEntry>();

export function checkRateLimit(identifier: string): { blocked: boolean; remainingAttempts: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry) {
    rateLimitMap.set(identifier, {
      attempts: 1,
      firstAttempt: now,
      blocked: false
    });
    return { blocked: false, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  // Check if block duration has passed
  if (entry.blocked) {
    if (now - entry.firstAttempt >= BLOCK_DURATION) {
      // Reset after block duration
      rateLimitMap.delete(identifier);
      return { blocked: false, remainingAttempts: MAX_ATTEMPTS };
    }
    return { blocked: true, remainingAttempts: 0 };
  }

  // Check if we should reset attempts (after block duration)
  if (now - entry.firstAttempt >= BLOCK_DURATION) {
    rateLimitMap.set(identifier, {
      attempts: 1,
      firstAttempt: now,
      blocked: false
    });
    return { blocked: false, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  // Increment attempts
  entry.attempts++;
  if (entry.attempts > MAX_ATTEMPTS) {
    entry.blocked = true;
    return { blocked: true, remainingAttempts: 0 };
  }

  return { blocked: false, remainingAttempts: MAX_ATTEMPTS - entry.attempts };
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .trim(); // Remove leading/trailing whitespace
}

// Validate email format
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// Password strength check
export function checkPasswordStrength(password: string): { 
  strong: boolean; 
  message: string;
} {
  if (password.length < 8) {
    return { 
      strong: false, 
      message: 'Password must be at least 8 characters long' 
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
    .filter(Boolean).length;

  if (strength < 3) {
    return {
      strong: false,
      message: 'Password must contain at least 3 of the following: uppercase letters, lowercase letters, numbers, special characters'
    };
  }

  return { strong: true, message: 'Password is strong' };
}
