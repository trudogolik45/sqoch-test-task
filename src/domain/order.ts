export type TicketType = 'full' | 'child'

/** Правила мероприятия — меняются здесь, интерфейс и тексты подхватывают их сами. */
export const MAX_PARTICIPANTS = 4
export const CHILD_AGE_LIMIT = 14
export const GUARDIAN_AGE = 18
export const PRICE: Record<TicketType, number> = { full: 2000, child: 1000 }
const MAX_AGE = 120

export type Ticket = { type: TicketType; price: number }

export type ParticipantDraft = { id: string; name: string; age: string }
export type OrderDraft = { participants: ParticipantDraft[]; email: string }

export type Participant = { id: string; name: string; age: number; ticket: Ticket }
export type Order = { participants: Participant[]; email: string; total: number }

export type FieldErrors = { name?: string; age?: string }
export type OrderErrors = {
  participants: Record<string, FieldErrors>
  email?: string
  order?: string
}

export type ValidationResult = { ok: true; order: Order } | { ok: false; errors: OrderErrors }

let lastParticipantId = 0

export function newParticipant(): ParticipantDraft {
  lastParticipantId += 1
  return { id: `p${lastParticipantId}`, name: '', age: '' }
}

export const emptyDraft = (): OrderDraft => ({ participants: [newParticipant()], email: '' })

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const AGE_PATTERN = /^\d+$/

export function ticketFor(age: number): Ticket {
  const type: TicketType = age < CHILD_AGE_LIMIT ? 'child' : 'full'
  return { type, price: PRICE[type] }
}

export function parseAge(raw: string): number | null {
  const value = raw.trim()
  if (!AGE_PATTERN.test(value)) return null
  const age = Number(value)
  return age <= MAX_AGE ? age : null
}

/** @param seatsLeft сколько мест ещё продаётся — заказ не может быть больше */
export function validateOrder(draft: OrderDraft, seatsLeft: number): ValidationResult {
  const errors: OrderErrors = { participants: {} }

  draft.participants.forEach((participant) => {
    const fieldErrors = validateParticipant(participant)
    if (fieldErrors.name || fieldErrors.age) errors.participants[participant.id] = fieldErrors
  })

  const emailError = validateEmail(draft.email)
  if (emailError) errors.email = emailError

  const orderError = validateComposition(draft.participants, seatsLeft)
  if (orderError) errors.order = orderError

  if (Object.keys(errors.participants).length > 0 || errors.email || errors.order) return { ok: false, errors }

  const participants = draft.participants.map(toParticipant)
  const total = participants.reduce((sum, participant) => sum + participant.ticket.price, 0)
  return { ok: true, order: { participants, email: draft.email.trim(), total } }
}

function validateParticipant({ name, age }: ParticipantDraft): FieldErrors {
  const errors: FieldErrors = {}
  if (!name.trim()) errors.name = 'Укажите имя'
  if (!age.trim()) errors.age = 'Укажите возраст'
  else if (parseAge(age) === null) errors.age = `Возраст — целое число от 0 до ${MAX_AGE}`
  return errors
}

function validateEmail(raw: string): string | undefined {
  const email = raw.trim()
  if (!email) return 'Укажите email'
  if (!EMAIL_PATTERN.test(email)) return 'Проверьте email: например, name@mail.ru'
}

function validateComposition(participants: ParticipantDraft[], seatsLeft: number): string | undefined {
  const count = participants.length
  if (count === 0) return 'Добавьте хотя бы одного участника'
  if (count > MAX_PARTICIPANTS) return `В одном заказе — не больше ${MAX_PARTICIPANTS} участников`
  if (count > seatsLeft) return `Осталось мест: ${seatsLeft} — уберите лишних участников`
  if (needsGuardian(participants)) {
    return `Детей до ${CHILD_AGE_LIMIT} лет пропускаем только вместе с участником от ${GUARDIAN_AGE} лет — добавьте взрослого`
  }
}

/** Смотрим только на возраст: незаполненное имя взрослого — ошибка поля, а не отсутствие взрослого. */
function needsGuardian(participants: ParticipantDraft[]): boolean {
  const ages = participants.map(({ age }) => parseAge(age)).filter((age) => age !== null)
  const hasChild = ages.some((age) => age < CHILD_AGE_LIMIT)
  const hasGuardian = ages.some((age) => age >= GUARDIAN_AGE)
  return hasChild && !hasGuardian
}

/** Вызывается только для проверенного черновика: имя и возраст уже валидны. */
function toParticipant(draft: ParticipantDraft): Participant {
  const age = Number(draft.age.trim())
  return { id: draft.id, name: draft.name.trim(), age, ticket: ticketFor(age) }
}
