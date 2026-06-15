export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? ''

export function gtagEvent(action: string, params: Record<string, string | number> = {}) {
  if (typeof window === 'undefined') return
  const w = window as any
  if (typeof w.gtag !== 'function') return
  w.gtag('event', action, params)
}
