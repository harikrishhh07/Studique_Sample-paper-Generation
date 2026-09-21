// Secure cookie utilities with proper security flags

export interface SecureCookieOptions {
  expires?: Date | number;
  maxAge?: number;
  domain?: string;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

// Simple cookie serializer for security (avoiding external dependency)
function serializeCookie(name: string, value: string, options: any = {}): string {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  
  if (options.maxAge) {
    cookie += `; Max-Age=${options.maxAge}`;
  }
  
  if (options.expires) {
    const expires = typeof options.expires === 'number' 
      ? new Date(Date.now() + options.expires * 24 * 60 * 60 * 1000)
      : options.expires;
    cookie += `; Expires=${expires.toUTCString()}`;
  }
  
  if (options.path) {
    cookie += `; Path=${options.path}`;
  }
  
  if (options.domain) {
    cookie += `; Domain=${options.domain}`;
  }
  
  if (options.secure) {
    cookie += `; Secure`;
  }
  
  if (options.httpOnly) {
    cookie += `; HttpOnly`;
  }
  
  if (options.sameSite) {
    cookie += `; SameSite=${options.sameSite}`;
  }
  
  return cookie;
}

export function setSecureCookie(
  name: string,
  value: string,
  options: SecureCookieOptions = {}
): string {
  const isHttps = typeof window !== 'undefined' ? window.location.protocol === 'https:' : process.env.NODE_ENV === 'production';
  const defaultOptions: SecureCookieOptions = {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax', // Always use lax for best compatibility
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  };

  const finalOptions = { ...defaultOptions, ...options };
  
  return serializeCookie(name, value, finalOptions);
}

export function clearSecureCookie(name: string, path: string = '/'): string {
  const isHttps = typeof window !== 'undefined' ? window.location.protocol === 'https:' : process.env.NODE_ENV === 'production';
  return serializeCookie(name, '', {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    path,
    expires: new Date(0),
  });
}

// Token validation utilities
export function isValidToken(token: string | undefined): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Basic token format validation
  if (token.length < 10) {
    return false;
  }
  
  // Check if token is not just whitespace
  if (token.trim() === '') {
    return false;
  }
  
  // Validate token format
  try {
    // If it looks like a session cookie, validate format
    if (token.includes('=') || token.includes(';')) {
      // It's a session cookie format
      return token.length > 20; // Reasonable session cookie length
    }
    
    // Basic token validation
    return true;
  } catch (error) {
    return false;
  }
}

// Decode JWT token manually (without external dependencies)
export function decodeToken(token: string): any {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Replace URL-safe chars and add padding if needed
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    
    // Decode base64
    const jsonString = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(jsonString);
  } catch (error) {
    console.debug('Token decode error:', error);
    return null;
  }
}

export function sanitizeForJSON(obj: any): any {
  if (typeof obj === 'string') {
    return obj.replace(/[<>]/g, '');
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForJSON);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeForJSON(value);
    }
    return sanitized;
  }
  
  return obj;
}
