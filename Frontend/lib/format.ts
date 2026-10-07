const TZ = 'Asia/Kolkata'

export function formatEventDate(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TZ,
  }).format(new Date(iso))
}

export function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', timeZone: TZ })
    .format(new Date(iso))
    .toUpperCase()
}

export const formatDateShort = formatShortDate


export function formatTime(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: TZ,
  }).format(new Date(iso))
}

export function formatClock(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: TZ,
  }).format(new Date(iso))
}

export function formatTimeRange(start: string, end: string) {
  const sameDay = formatEventDate(start) === formatEventDate(end)
  return sameDay
    ? `${formatTime(start)} – ${formatTime(end)}`
    : `${formatShortDate(start)} ${formatTime(start)} – ${formatShortDate(end)} ${formatTime(end)}`
}

export function relativeTime(iso: string, now = Date.now()) {
  const diffSec = Math.round((now - new Date(iso).getTime()) / 1000)
  if (diffSec < 45) return 'Just now'
  const min = Math.round(diffSec / 60)
  if (min < 60) return `${min} min${min === 1 ? '' : 's'} ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} hr${hr === 1 ? '' : 's'} ago`
  const d = Math.round(hr / 24)
  return `${d} day${d === 1 ? '' : 's'} ago`
}
