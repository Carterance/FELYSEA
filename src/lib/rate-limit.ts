/**
 * Rate limiter en mémoire — suffisant pour un MVP sur une seule instance.
 *
 * ⚠️ En production multi-instance (plusieurs instances serverless ou
 * plusieurs conteneurs), chaque instance a sa propre mémoire : ce limiteur
 * devient approximatif. Avant un vrai lancement public, remplacer par
 * Upstash Redis (@upstash/ratelimit) qui s'intègre en quelques lignes avec
 * la même interface. Documenté dans le README.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= max) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}
