/**
 * CSV para Excel en español: separador ";" y BOM para que respete las tildes.
 * Las celdas que empiezan por = + - @ se prefijan con ' para evitar inyección de fórmulas.
 */
export function toCsv(headers: string[], rows: (string | number)[][]) {
  const cell = (v: string | number) => {
    let s = String(v)
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return '﻿' + [headers, ...rows].map((r) => r.map(cell).join(';')).join('\r\n')
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
