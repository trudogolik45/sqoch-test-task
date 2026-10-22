import { describe, expect, it } from 'vitest'
import { type OrderDraft, ticketFor, validateOrder } from './order'

const participant = (name: string, age: string, id = name) => ({ id, name, age })

const draft = (overrides: Partial<OrderDraft> = {}): OrderDraft => ({
  participants: [participant('Анна', '35')],
  email: 'anna@example.com',
  ...overrides,
})

const errorsOf = (input: OrderDraft, maxParticipants = 4) => {
  const result = validateOrder(input, maxParticipants)
  if (result.ok) throw new Error('ожидали ошибки валидации')
  return result.errors
}

describe('ticketFor', () => {
  it('продаёт полный билет за 2000 ₽ с 14 лет', () => {
    expect(ticketFor(14)).toEqual({ type: 'full', price: 2000 })
  })

  it('продаёт детский билет за 1000 ₽ младше 14 лет', () => {
    expect(ticketFor(13)).toEqual({ type: 'child', price: 1000 })
    expect(ticketFor(0)).toEqual({ type: 'child', price: 1000 })
  })
})

describe('validateOrder', () => {
  it('собирает заказ с билетами и итоговой суммой', () => {
    const result = validateOrder(
      draft({
        participants: [participant(' Анна ', '35'), participant('Миша', '7'), participant('Оля', '15')],
        email: ' anna@example.com ',
      }),
      4,
    )

    expect(result).toEqual({
      ok: true,
      order: {
        email: 'anna@example.com',
        total: 5000,
        participants: [
          { id: ' Анна ', name: 'Анна', age: 35, ticket: { type: 'full', price: 2000 } },
          { id: 'Миша', name: 'Миша', age: 7, ticket: { type: 'child', price: 1000 } },
          { id: 'Оля', name: 'Оля', age: 15, ticket: { type: 'full', price: 2000 } },
        ],
      },
    })
  })

  it('требует имя каждого участника', () => {
    const errors = errorsOf(draft({ participants: [participant('  ', '30', 'p1')] }))

    expect(errors.participants.p1?.name).toBe('Укажите имя')
  })

  it.each([
    ['', 'Укажите возраст'],
    ['abc', 'Возраст — целое число от 0 до 120'],
    ['12.5', 'Возраст — целое число от 0 до 120'],
    ['-1', 'Возраст — целое число от 0 до 120'],
    ['121', 'Возраст — целое число от 0 до 120'],
  ])('отклоняет возраст «%s»', (age, message) => {
    const errors = errorsOf(draft({ participants: [participant('Анна', age, 'p1')] }))

    expect(errors.participants.p1?.age).toBe(message)
  })

  it.each([
    ['', 'Укажите email'],
    ['anna@', 'Проверьте email: например, name@mail.ru'],
    ['anna example@mail.ru', 'Проверьте email: например, name@mail.ru'],
  ])('отклоняет email «%s»', (email, message) => {
    expect(errorsOf(draft({ email })).email).toBe(message)
  })

  it('не пускает ребёнка без участника от 18 лет', () => {
    const errors = errorsOf(draft({ participants: [participant('Оля', '17'), participant('Миша', '7')] }))

    expect(errors.order).toBe('Детей до 14 лет пропускаем только вместе с участником от 18 лет — добавьте взрослого')
  })

  it('пускает подростка 14–17 лет без взрослого', () => {
    expect(validateOrder(draft({ participants: [participant('Оля', '16')] }), 4).ok).toBe(true)
  })

  it('принимает ровно 18 лет как взрослого сопровождающего', () => {
    const result = validateOrder(draft({ participants: [participant('Петя', '18'), participant('Миша', '3')] }), 4)

    expect(result.ok).toBe(true)
  })

  it('требует хотя бы одного участника', () => {
    expect(errorsOf(draft({ participants: [] })).order).toBe('Добавьте хотя бы одного участника')
  })

  it('не даёт оформить больше участников, чем разрешено', () => {
    const five = ['А', 'Б', 'В', 'Г', 'Д'].map((name) => participant(name, '30'))

    expect(errorsOf(draft({ participants: five })).order).toBe('В одном заказе — не больше 4 участников')
  })

  it('ограничивает заказ оставшимися местами', () => {
    const two = [participant('Анна', '30'), participant('Петя', '31')]

    expect(errorsOf(draft({ participants: two }), 1).order).toBe('Осталось мест: 1 — уберите лишних участников')
  })
})
