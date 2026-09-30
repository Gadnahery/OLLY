export function formatMoney(amount, currency = 'TZS') {
  const n = Number(amount) || 0
  return `${currency} ${n.toLocaleString('en-TZ', { maximumFractionDigits: 0 })}`
}

export function formatNumber(n, decimals = 0) {
  return Number(n || 0).toLocaleString('en-TZ', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
