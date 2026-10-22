import type { Order } from '../domain/order'
import { formatAge, formatRub } from '../ui/format'
import { TICKET_LABEL } from '../ui/labels'

/** Список билетов заказа с итогом — общий для проверки и успешного результата. */
export function OrderSummary({ order }: { order: Order }) {
  return (
    <>
      <ul className="summary">
        {order.participants.map(({ id, name, age, ticket }) => (
          <li key={id} className="summary__row">
            <span>
              <span className="summary__name">{name}</span>
              <span className="muted">
                {formatAge(age)} · {TICKET_LABEL[ticket.type].toLowerCase()} билет
              </span>
            </span>
            <span>{formatRub(ticket.price)}</span>
          </li>
        ))}
      </ul>
      <p className="summary__total">
        <span>Итого</span>
        <strong data-testid="order-total">{formatRub(order.total)}</strong>
      </p>
    </>
  )
}
