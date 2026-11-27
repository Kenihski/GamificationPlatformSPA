// Helpers for returning to the page the user came from, like returnUrl in Subapp 1.

// Accept only paths inside this app, so a link cannot send the user to another site.
export const getSafeReturnUrl = (value: string | null | undefined): string | null => {
  if (!value || !value.startsWith('/')) return null
  if (value.startsWith('//') || value.startsWith('/\\')) return null
  return value
}

// Adds ?returnUrl=... to a path when a return URL is given.
export const withReturnUrl = (path: string, returnUrl: string | null | undefined): string => {
  const safeReturnUrl = getSafeReturnUrl(returnUrl)
  return safeReturnUrl
    ? `${path}?returnUrl=${encodeURIComponent(safeReturnUrl)}`
    : path
}
