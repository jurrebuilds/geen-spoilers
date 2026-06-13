const TIME_ZONE = 'Europe/Amsterdam'

const dayKeyFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const dayLabelFormat = new Intl.DateTimeFormat('nl-NL', {
  timeZone: TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const weekdayFormat = new Intl.DateTimeFormat('nl-NL', {
  timeZone: TIME_ZONE,
  weekday: 'long',
})

const dayMonthFormat = new Intl.DateTimeFormat('nl-NL', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'long',
})

const timeFormat = new Intl.DateTimeFormat('nl-NL', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
})

// Sorteerbare sleutel per dag in Nederlandse tijd, bijv. "2026-06-14"
export function dayKey(iso) {
  return dayKeyFormat.format(new Date(iso))
}

// Kop per dag, bijv. "Zondag 14 juni"
export function dayLabel(iso) {
  const label = dayLabelFormat.format(new Date(iso))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// Weekdag met hoofdletter, bijv. "Zondag"
export function weekdayLabel(iso) {
  const label = weekdayFormat.format(new Date(iso))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// Dag en maand, bijv. "14 juni"
export function dayMonthLabel(iso) {
  return dayMonthFormat.format(new Date(iso))
}

// Aftraptijd in Nederlandse tijd, bijv. "22:00"
export function kickoffTime(iso) {
  return timeFormat.format(new Date(iso))
}

// Dagsleutel van vandaag in Nederlandse tijd
export function todayKey() {
  return dayKeyFormat.format(new Date())
}

// Dagsleutel van gisteren in Nederlandse tijd
export function yesterdayKey() {
  return dayKeyFormat.format(new Date(Date.now() - 24 * 60 * 60 * 1000))
}

// Aftraptijd in een opgegeven tijdzone (voor de lokale tijd bij het stadion)
export function timeInZone(iso, tz) {
  return new Intl.DateTimeFormat('nl-NL', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

// Dag in een opgegeven tijdzone, bijv. "vrijdag 12 juni"
export function dayInZone(iso, tz) {
  return new Intl.DateTimeFormat('nl-NL', {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso))
}
