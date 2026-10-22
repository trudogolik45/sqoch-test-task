import type { Order } from '../domain/order'
import { formatRub } from '../ui/format'
import { OrderSummary } from './OrderSummary'

type Props = {
  order: Order
  submitting: boolean
  error?: string
  onEdit(): void
  onConfirm(): void
}

export function OrderReview({ order, submitting, error, onEdit, onConfirm }: Props) {
  return (
    <div className="card">
      <h2>Проверьте заказ</h2>
      <section className="review" aria-labelledby="review-title">
        <h3 id="review-title">Состав заказа</h3>
        <OrderSummary order={order} />
        <p className="review__email">
          <span className="muted">Билеты придут на</span> <span>{order.email}</span>
        </p>
      </section>

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      <div className="actions">
        <button type="button" className="button button--ghost" onClick={onEdit} disabled={submitting}>
          Изменить данные
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={onConfirm}
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? 'Оформляем…' : `Подтвердить и оплатить · ${formatRub(order.total)}`}
        </button>
      </div>
      <p className="muted small">Демо: оплата не настоящая, деньги не спишутся.</p>
    </div>
  )
}
