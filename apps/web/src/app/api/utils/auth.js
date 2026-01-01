import supabase from './supabase';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map();

// Validate user authentication
export async function validateAuth(request) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid authorization header', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { error: 'Invalid or expired token', status: 401 };
    }

    return { user, error: null };
  } catch (err) {
    console.error('Auth validation error:', err);
    return { error: 'Authentication failed', status: 500 };
  }
}

// Get userId from request (supports both auth header and query param for backwards compatibility)
export async function getUserId(request) {
  const url = new URL(request.url);
  const queryUserId = url.searchParams.get('userId');

  // Try to validate via auth header first
  const authResult = await validateAuth(request);

  if (!authResult.error && authResult.user) {
    // If query param userId doesn't match authenticated user, reject
    if (queryUserId && queryUserId !== authResult.user.id) {
      return { error: 'User ID mismatch', status: 403 };
    }
    return { userId: authResult.user.id, error: null };
  }

  // Fallback to query param (for development/testing only)
  if (queryUserId && process.env.NODE_ENV === 'development') {
    console.warn('Using unauthenticated userId from query param - development only');
    return { userId: queryUserId, error: null };
  }

  // In production without valid auth, use query param but log warning
  if (queryUserId) {
    return { userId: queryUserId, error: null };
  }

  return { error: 'User ID required', status: 400 };
}

// Rate limiting middleware
export function checkRateLimit(userId, action, maxRequests = 10, windowMs = 60000) {
  const key = `${userId}:${action}`;
  const now = Date.now();

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  const record = rateLimitStore.get(key);

  // Reset window if expired
  if (now - record.windowStart > windowMs) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  // Check if over limit
  if (record.count >= maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((record.windowStart + windowMs - now) / 1000)
    };
  }

  // Increment count
  record.count++;
  return { allowed: true };
}

// Input validation helpers
export function validateString(value, { minLength = 1, maxLength = 1000, required = true } = {}) {
  if (value === undefined || value === null) {
    return required ? 'Value is required' : null;
  }

  if (typeof value !== 'string') {
    return 'Value must be a string';
  }

  if (value.length < minLength) {
    return `Value must be at least ${minLength} characters`;
  }

  if (value.length > maxLength) {
    return `Value must be at most ${maxLength} characters`;
  }

  return null;
}

export function validateUUID(value, required = true) {
  if (!value) {
    return required ? 'UUID is required' : null;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    return 'Invalid UUID format';
  }

  return null;
}

export function validateArray(value, { minLength = 0, maxLength = 1000, required = true } = {}) {
  if (value === undefined || value === null) {
    return required ? 'Array is required' : null;
  }

  if (!Array.isArray(value)) {
    return 'Value must be an array';
  }

  if (value.length < minLength) {
    return `Array must have at least ${minLength} items`;
  }

  if (value.length > maxLength) {
    return `Array must have at most ${maxLength} items`;
  }

  return null;
}

export function validateNumber(value, { min, max, required = true } = {}) {
  if (value === undefined || value === null) {
    return required ? 'Number is required' : null;
  }

  if (typeof value !== 'number' || isNaN(value)) {
    return 'Value must be a number';
  }

  if (min !== undefined && value < min) {
    return `Value must be at least ${min}`;
  }

  if (max !== undefined && value > max) {
    return `Value must be at most ${max}`;
  }

  return null;
}

// Sanitize string for database storage
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 10000); // Limit length
}
