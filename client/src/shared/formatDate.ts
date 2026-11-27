// Dates in the same fixed formats as Subapp 1 ("dd.MM.yyyy" and "dd.MM.yyyy HH:mm"),
// independent of the browser's locale.
const pad = (value: number) => String(value).padStart(2, '0')

export function formatDate(value: string | Date): string {
  const date = new Date(value)
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`
}

export function formatDateTime(value: string | Date): string {
  const date = new Date(value)
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
