// Visita por sesion y por slug. Puro, sin React y sin storage adentro.

const MAX_USER_AGENT = 400

export function visitKey(slug: string): string {
  return `lq_visit_${slug}`
}

export function buildVisitRow(
  slug: string,
  userAgent: string,
  referrer: string,
): Record<string, unknown> {
  const trimmed = referrer.trim()
  return {
    client_slug: slug,
    user_agent: userAgent.slice(0, MAX_USER_AGENT),
    referrer: trimmed.length === 0 ? null : trimmed,
  }
}
