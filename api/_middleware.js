// Simple in-memory rate limiter for Vercel serverless functions
// Resets on cold start (acceptable for basic protection)
const rateLimitMap = new Map()

const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30 // max requests per IP per window

/**
 * Basic rate limiting and request validation middleware.
 * Returns null if request is allowed, or a response object if blocked.
 */
export function validateRequest(req, res) {
  // CORS headers — restrict to production domain
  const allowedOrigin = process.env.CORS_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return 'handled'
  }

  // Rate limiting by IP
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, [])
  }

  const requests = rateLimitMap.get(ip).filter(t => t > windowStart)
  requests.push(now)
  rateLimitMap.set(ip, requests)

  if (requests.length > RATE_LIMIT_MAX_REQUESTS) {
    res.status(429).json({ error: 'Too many requests. Please try again later.' })
    return 'handled'
  }

  // Clean up old entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, timestamps] of rateLimitMap) {
      const recent = timestamps.filter(t => t > windowStart)
      if (recent.length === 0) rateLimitMap.delete(key)
      else rateLimitMap.set(key, recent)
    }
  }

  return null // allowed
}
