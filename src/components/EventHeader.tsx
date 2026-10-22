import type { EventInfo } from '../api/ticketApi'
import { formatEventDate, formatSeats } from '../ui/format'

export function EventHeader({ event }: { event: EventInfo }) {
  return (
    <header className="event">
      <p className="event__brand">Sqoch</p>
      <h1>{event.title}</h1>
      <p className="event__meta">
        <time dateTime={event.startsAt}>{formatEventDate(event.startsAt)}</time> · {event.venue}
      </p>
      <p className={event.seatsLeft > 0 ? 'badge' : 'badge badge--danger'}>{formatSeats(event.seatsLeft)}</p>
    </header>
  )
}
