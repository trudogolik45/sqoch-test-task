const rub = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })
const plural = new Intl.PluralRules('ru-RU')
const eventDate = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Moscow',
})

type Forms = { one: string; few: string; many: string }

function pluralize(count: number, forms: Forms): string {
  const category = plural.select(count)
  if (category === 'one') return forms.one
  if (category === 'few') return forms.few
  return forms.many
}

export const formatRub = (amount: number) => rub.format(amount)

export const formatAge = (age: number) => `${age} ${pluralize(age, { one: 'год', few: 'года', many: 'лет' })}`

export function formatSeats(seats: number): string {
  if (seats === 0) return 'Мест нет'
  return `Осталось ${seats} ${pluralize(seats, { one: 'место', few: 'места', many: 'мест' })}`
}

export const formatEventDate = (iso: string) => eventDate.format(new Date(iso))
