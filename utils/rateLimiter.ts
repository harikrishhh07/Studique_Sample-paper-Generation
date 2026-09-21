// Simple in-memory rate limiter for API routes
interface RateLimitData {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitData>();

export function rateLimit(
  identifier: string,
  limit: number = 5, // requests
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const data = rateLimitMap.get(identifier);
  
  // Clean up expired entries periodically
  if (Math.random() < 0.1) { // 10% chance
    const keysToDelete: string[] = [];
    rateLimitMap.forEach((value, key) => {
      if (value.resetTime < now) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => rateLimitMap.delete(key));
  }
  
  if (!data || data.resetTime < now) {
    // First request or window expired
    const newData: RateLimitData = {
      count: 1,
      resetTime: now + windowMs
    };
    rateLimitMap.set(identifier, newData);
    return { success: true, remaining: limit - 1, resetTime: newData.resetTime };
  }
  
  if (data.count >= limit) {
    // Rate limit exceeded
    return { success: false, remaining: 0, resetTime: data.resetTime };
  }
  
  // Increment count
  data.count++;
  rateLimitMap.set(identifier, data);
  
  return { success: true, remaining: limit - data.count, resetTime: data.resetTime };
}

export function getClientIP(req: any): string {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}
