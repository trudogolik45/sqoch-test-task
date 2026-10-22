import { type SubmitEvent, type ReactNode, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import {
  CHILD_AGE_LIMIT,
  MAX_PARTICIPANTS,
  type FieldErrors,
  type Order,
  type OrderDraft,
  type OrderErrors,
  type ParticipantDraft,
  newParticipant,
  parseAge,
  ticketFor,
  validateOrder,
} from '../domain/order'
import { formatRub } from '../ui/format'
import { TICKET_LABEL } from '../ui/labels'

type Props = {
  draft: OrderDraft
  seatsLeft: number
  showErrorsInitially: boolean
  onChange(draft: OrderDraft): void
  onSubmit(order: Order): void
}

export function ParticipantsForm({ draft, seatsLeft, showErrorsInitially, onChange, onSubmit }: Props) {
  const [showErrors, setShowErrors] = useState(showErrorsInitially)
  const orderErrorRef = useRef<HTMLParagraphElement>(null)
  const validation = validateOrder(draft, seatsLeft)
  const errors = showErrors && !validation.ok ? validation.errors : undefined
  const maxParticipants = Math.min(MAX_PARTICIPANTS, seatsLeft)

  const updateParticipant = (updated: ParticipantDraft) =>
    onChange({ ...draft, participants: draft.participants.map((p) => (p.id === updated.id ? updated : p)) })

  const removeParticipant = (id: string) =>
    onChange({ ...draft, participants: draft.participants.filter((p) => p.id !== id) })

  const addParticipant = () => onChange({ ...draft, participants: [...draft.participants, newParticipant()] })

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault()
    if (validation.ok) {
      onSubmit(validation.order)
      return
    }
    flushSync(() => setShowErrors(true))
    focusFirstError(validation.errors, draft, orderErrorRef.current)
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <h2>Участники</h2>
      <p className="muted">
        До {MAX_PARTICIPANTS} человек в заказе. Детям до {CHILD_AGE_LIMIT} лет — детский билет, им нужен взрослый от 18
        лет в этом же заказе.
      </p>

      <div className="participants">
        {draft.participants.map((participant, index) => (
          <ParticipantFields
            key={participant.id}
            participant={participant}
            number={index + 1}
            errors={errors?.participants[participant.id]}
            canRemove={draft.participants.length > 1}
            onChange={updateParticipant}
            onRemove={() => removeParticipant(participant.id)}
          />
        ))}
      </div>

      <button
        type="button"
        className="button button--ghost"
        onClick={addParticipant}
        disabled={draft.participants.length >= maxParticipants}
      >
        <span aria-hidden="true">+</span> Добавить участника
      </button>

      {errors?.order && (
        <p className="alert" role="alert" ref={orderErrorRef} tabIndex={-1}>
          {errors.order}
        </p>
      )}

      <Field
        id="email"
        label="Email для билетов"
        hint="Один на заказ — пришлём сюда все билеты"
        error={errors?.email}
      >
        {(control) => (
          <input
            {...control}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={draft.email}
            onChange={(event) => onChange({ ...draft, email: event.target.value })}
          />
        )}
      </Field>

      <div className="form-footer">
        <p className="total">
          <span className="muted">Предварительно</span>
          <strong>{formatRub(draftTotal(draft))}</strong>
        </p>
        <button type="submit" className="button button--primary">
          Перейти к проверке
        </button>
      </div>
    </form>
  )
}

type ParticipantFieldsProps = {
  participant: ParticipantDraft
  number: number
  errors?: FieldErrors
  canRemove: boolean
  onChange(participant: ParticipantDraft): void
  onRemove(): void
}

function ParticipantFields({ participant, number, errors, canRemove, onChange, onRemove }: ParticipantFieldsProps) {
  return (
    <fieldset className="participant">
      <legend>Участник {number}</legend>
      {canRemove && (
        <button
          type="button"
          className="participant__remove"
          aria-label={`Удалить участника ${number}`}
          onClick={onRemove}
        >
          Удалить
        </button>
      )}
      <div className="participant__fields">
        <Field id={`${participant.id}-name`} label="Имя" error={errors?.name}>
          {(control) => (
            <input
              {...control}
              autoComplete={number === 1 ? 'name' : 'off'}
              maxLength={80}
              value={participant.name}
              onChange={(event) => onChange({ ...participant, name: event.target.value })}
            />
          )}
        </Field>
        <Field id={`${participant.id}-age`} label="Возраст" hint={ageHint(participant.age)} error={errors?.age}>
          {(control) => (
            <input
              {...control}
              inputMode="numeric"
              autoComplete="off"
              maxLength={3}
              value={participant.age}
              onChange={(event) => onChange({ ...participant, age: event.target.value })}
            />
          )}
        </Field>
      </div>
    </fieldset>
  )
}

type FieldControlProps = { id: string; 'aria-describedby'?: string; 'aria-invalid': boolean }
type FieldProps = { id: string; label: string; hint?: string; error?: string; children(props: FieldControlProps): ReactNode }

/** Подпись, подсказка и ошибка поля. Ошибка заменяет подсказку и связана с полем через aria-describedby. */
function Field({ id, label, hint, error, children }: FieldProps) {
  const message = error ?? hint
  const messageId = `${id}-message`
  return (
    <div className={error ? 'field field--invalid' : 'field'}>
      <label htmlFor={id}>{label}</label>
      {children({ id, 'aria-describedby': message ? messageId : undefined, 'aria-invalid': Boolean(error) })}
      {message && (
        <p id={messageId} className={error ? 'field__error' : 'field__hint'}>
          {message}
        </p>
      )}
    </div>
  )
}

function ageHint(rawAge: string): string {
  const age = parseAge(rawAge)
  if (age === null) return `До ${CHILD_AGE_LIMIT} лет — детский билет`
  const ticket = ticketFor(age)
  return `${TICKET_LABEL[ticket.type]} билет · ${formatRub(ticket.price)}`
}

function draftTotal(draft: OrderDraft): number {
  return draft.participants.reduce((sum, { age }) => {
    const parsed = parseAge(age)
    return parsed === null ? sum : sum + ticketFor(parsed).price
  }, 0)
}

function focusFirstError(errors: OrderErrors, draft: OrderDraft, orderError: HTMLElement | null) {
  const fieldIds = draft.participants.flatMap(({ id }) => {
    const fieldErrors = errors.participants[id]
    return [fieldErrors?.name && `${id}-name`, fieldErrors?.age && `${id}-age`]
  })
  const firstFieldId = [...fieldIds, errors.email && 'email'].find(Boolean)
  if (firstFieldId) {
    document.getElementById(firstFieldId)?.focus()
    return
  }
  orderError?.focus()
}
