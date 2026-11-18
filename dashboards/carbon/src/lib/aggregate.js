export const countBy = (rows, keyOf) => {
  const counts = new Map()
  for (const row of rows) {
    const key = keyOf(row)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

export const sumBy = (rows, keyOf, valueOf) => {
  const sums = new Map()
  for (const row of rows) {
    const key = keyOf(row)
    sums.set(key, (sums.get(key) ?? 0) + (valueOf(row) ?? 0))
  }
  return sums
}

export const groupRows = (rows, keyOf) => {
  const groups = new Map()
  for (const row of rows) {
    const key = keyOf(row)
    groups.set(key, [...(groups.get(key) ?? []), row])
  }
  return groups
}

export const percentOf = (part, whole) => (whole ? (part * 100) / whole : 0)

export const sum = (rows, valueOf) => rows.reduce((total, row) => total + (valueOf(row) ?? 0), 0)

export const distinctBy = (rows, keyOf) => [...new Map(rows.map((row) => [keyOf(row), row])).values()]

export const formatNumber = (value, fractionDigits = 0) =>
  value === null || value === undefined || Number.isNaN(value)
    ? '—'
    : value.toLocaleString(undefined, { maximumFractionDigits: fractionDigits, minimumFractionDigits: fractionDigits })

export const truncateLabel = (text, maxLength = 34) => (text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text)

// Windows editions cluster into families so part-to-whole views can show both levels.
export const osFamilyOf = (caption) =>
  caption.includes('Server') ? 'Windows Server' : caption.includes('Windows 11') ? 'Windows 11' : caption.includes('Windows 10') ? 'Windows 10' : 'Other'

export const shortOsName = (caption) => caption.replace(/^Microsoft\s+/, '').replace(/^Windows Server/, 'Server')
