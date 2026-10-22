import { useState } from 'react'
import type { TicketApi } from '../api/ticketApi'
import { formatSeats } from '../ui/format'

const PRESETS = [
  { label: 'Оставить 1 место', seats: 1 },
  { label: 'Раскупить всё', seats: 0 },
  { label: 'Вернуть 50 мест', seats: 50 },
]

/** Пульт для проверяющего: меняет остаток мест на мок-сервере, не трогая то, что видит покупатель. */
export function DemoPanel({ api }: { api: TicketApi }) {
  const [status, setStatus] = useState('')

  const apply = (seats: number) => {
    api.setSeatsLeft(seats)
    setStatus(`На сервере: ${formatSeats(seats).toLowerCase()}. Покупатель узнает об этом при подтверждении.`)
  }

  return (
    <details className="demo">
      <summary>Демо: другие покупатели</summary>
      <p className="small">Имитирует покупки других людей, пока вы оформляете заказ.</p>
      <div className="demo__buttons">
        {PRESETS.map(({ label, seats }) => (
          <button key={label} type="button" className="button button--small" onClick={() => apply(seats)}>
            {label}
          </button>
        ))}
      </div>
      <p className="small" role="status">
        {status}
      </p>
    </details>
  )
}
