// Formats a number as Argentine-style thousands-separated integer (dot as separator, no decimals)
// Uses regex instead of toLocaleString to avoid locale availability issues in server/client environments
export function formatAmount(n: number | string): string {
  return Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
