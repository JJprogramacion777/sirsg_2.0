const dateFmt = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' })

export function formatDateTime(iso: string) {
  return dateFmt.format(new Date(iso))
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** Convierte un ISO a valor de <input type="datetime-local">. */
export function toLocalInput(iso: string) {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}
