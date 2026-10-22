import type { Order } from '../domain/order'

export type EventInfo = {
  title: string
  startsAt: string
  venue: string
  seatsLeft: number
}

export type PlaceOrderResult =
  | { status: 'confirmed'; orderNumber: string }
  | { status: 'sold_out'; seatsLeft: number }

export type TicketApi = {
  getEvent(): Promise<EventInfo>
  placeOrder(order: Order): Promise<PlaceOrderResult>
  /** Только для демо: имитирует покупки других людей, пока вы оформляете заказ. */
  setSeatsLeft(seatsLeft: number): void
}

type Options = { seatsLeft: number; delayMs: number }

const EVENT = {
  title: 'Sqoch Live: ночь синтезаторов',
  startsAt: '2026-11-21T19:00:00+03:00',
  venue: 'Москва, ДК «Рассвет»',
}

const FIRST_ORDER_NUMBER = 1001

/** Мок бэкенда: держит остаток мест в памяти и отвечает с сетевой задержкой. */
export function createTicketApi({ seatsLeft, delayMs }: Options): TicketApi {
  let seats = seatsLeft
  let nextOrderNumber = FIRST_ORDER_NUMBER

  const respond = <T,>(value: () => T) =>
    new Promise<T>((resolve) => setTimeout(() => resolve(value()), delayMs))

  return {
    getEvent: () => respond(() => ({ ...EVENT, seatsLeft: seats })),
    placeOrder: (order) =>
      respond((): PlaceOrderResult => {
        if (order.participants.length > seats) return { status: 'sold_out', seatsLeft: seats }
        seats -= order.participants.length
        return { status: 'confirmed', orderNumber: `SQ-${nextOrderNumber++}` }
      }),
    setSeatsLeft: (value) => {
      seats = value
    },
  }
}
