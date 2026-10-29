export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = typeof dateStr === 'string' ? new Date(dateStr + 'T00:00:00') : dateStr
  return d.toLocaleDateString('pt-BR')
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
