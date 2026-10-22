import type { Order } from '../domain/order'
import { OrderSummary } from './OrderSummary'

type SuccessProps = { order: Order; orderNumber: string; onNewOrder(): void }

export function OrderSuccess({ order, orderNumber, onNewOrder }: SuccessProps) {
  return (
    <div className="card result result--success">
      <p className="result__icon" aria-hidden="true">
        ✓
      </p>
      <h2>Заказ {orderNumber} оформлен</h2>
      <p>
        Билеты отправили на <strong>{order.email}</strong>. Покажите их на входе с телефона или распечатанными.
      </p>
      <OrderSummary order={order} />
      <button type="button" className="button button--ghost" onClick={onNewOrder}>
        Оформить ещё один заказ
      </button>
    </div>
  )
}

type SoldOutProps = { order: Order; seatsLeft: number; onEdit(): void }

export function OrderSoldOut({ order, seatsLeft, onEdit }: SoldOutProps) {
  return (
    <div className="card result result--sold-out">
      <p className="result__icon" aria-hidden="true">
        !
      </p>
      <h2>Места закончились</h2>
      {seatsLeft > 0 ? (
        <>
          <p>
            Пока вы оформляли заказ, часть билетов раскупили. Осталось мест: {seatsLeft}, а в заказе —{' '}
            {order.participants.length}. Деньги не списаны.
          </p>
          <button type="button" className="button button--primary" onClick={onEdit}>
            Изменить состав заказа
          </button>
        </>
      ) : (
        <p>Все билеты раскуплены, пока вы оформляли заказ. Деньги не списаны.</p>
      )}
    </div>
  )
}

export function EventSoldOut() {
  return (
    <div className="card result result--sold-out">
      <h2>Билеты закончились</h2>
      <p>На это мероприятие мест больше нет.</p>
    </div>
  )
}
