import { describe, expect, it } from 'vitest'
import type { Order } from '../domain/order'
import { createTicketApi } from './ticketApi'

const orderFor = (count: number): Order => ({
  email: 'anna@example.com',
  total: count * 2000,
  participants: Array.from({ length: count }, (_, index) => ({
    id: `p${index}`,
    name: `Гость ${index}`,
    age: 30,
    ticket: { type: 'full', price: 2000 },
  })),
})

describe('createTicketApi', () => {
  it('отдаёт мероприятие с числом свободных мест', async () => {
    const api = createTicketApi({ seatsLeft: 7, delayMs: 0 })

    const event = await api.getEvent()

    expect(event.seatsLeft).toBe(7)
    expect(event.title).toBeTruthy()
  })

  it('подтверждает заказ и списывает места', async () => {
    const api = createTicketApi({ seatsLeft: 5, delayMs: 0 })

    const result = await api.placeOrder(orderFor(3))

    expect(result).toEqual({ status: 'confirmed', orderNumber: 'SQ-1001' })
    expect((await api.getEvent()).seatsLeft).toBe(2)
  })

  it('выдаёт каждому заказу новый номер', async () => {
    const api = createTicketApi({ seatsLeft: 5, delayMs: 0 })

    await api.placeOrder(orderFor(1))
    const second = await api.placeOrder(orderFor(1))

    expect(second).toEqual({ status: 'confirmed', orderNumber: 'SQ-1002' })
  })

  it('отказывает, если мест меньше, чем участников, и ничего не списывает', async () => {
    const api = createTicketApi({ seatsLeft: 5, delayMs: 0 })
    api.setSeatsLeft(1)

    const result = await api.placeOrder(orderFor(2))

    expect(result).toEqual({ status: 'sold_out', seatsLeft: 1 })
    expect((await api.getEvent()).seatsLeft).toBe(1)
  })
})
