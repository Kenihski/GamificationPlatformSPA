// Builds the address of an uploaded or default image in one place.
// Locally VITE_API_BASE_URL is empty and Vite proxies /images and /uploads to the API;
// a deployed frontend can point it at the API host instead.
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

// Addresses that are already complete (external, preview or inline images) are kept.
const isAbsolute = (url: string) => /^(https?:|blob:|data:)/i.test(url)

export function getImageUrl(url: string): string
export function getImageUrl(url: string | null | undefined): string | null
export function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (isAbsolute(url)) return url
  return `${apiBaseUrl}/${url.replace(/^\/+/, '')}`
}
