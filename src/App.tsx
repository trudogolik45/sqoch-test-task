import { useCallback, useEffect, useRef, useState } from 'react'
import type { EventInfo, TicketApi } from './api/ticketApi'
import { EventHeader } from './components/EventHeader'
import { OrderReview } from './components/OrderReview'
import { EventSoldOut, OrderSoldOut, OrderSuccess } from './components/OrderResult'
import { ParticipantsForm } from './components/ParticipantsForm'
import { type StepName, Stepper } from './components/Stepper'
import { type Order, emptyDraft } from './domain/order'

type Screen =
  | { name: 'form'; showErrors: boolean }
  | { name: 'review'; order: Order; submitting: boolean; error?: string }
  | { name: 'success'; order: Order; orderNumber: string }
  | { name: 'sold_out'; order: Order; seatsLeft: number }

const STEP_OF_SCREEN: Record<Screen['name'], StepName> = {
  form: 'Участники',
  review: 'Проверка',
  success: 'Готово',
  sold_out: 'Проверка',
}

export default function App({ api }: { api: TicketApi }) {
  const { event, failed, reload, setSeatsLeft } = useEvent(api)
  const [draft, setDraft] = useState(emptyDraft)
  const [screen, setScreen] = useState<Screen>({ name: 'form', showErrors: false })
  const contentRef = useFocusHeadingOnChange<HTMLDivElement>(screen.name)

  if (failed) return <LoadError onRetry={reload} />
  if (!event) return <p className="loading">Загружаем мероприятие…</p>

  const confirm = async (order: Order) => {
    setScreen({ name: 'review', order, submitting: true })
    try {
      const result = await api.placeOrder(order)
      if (result.status === 'sold_out') {
        setSeatsLeft(result.seatsLeft)
        setScreen({ name: 'sold_out', order, seatsLeft: result.seatsLeft })
        return
      }
      setSeatsLeft(result.seatsLeft)
      setScreen({ name: 'success', order, orderNumber: result.orderNumber })
    } catch {
      setScreen({ name: 'review', order, submitting: false, error: 'Не получилось оформить заказ. Попробуйте ещё раз.' })
    }
  }

  const recheckSeats = async () => {
    await reload()
    setScreen({ name: 'form', showErrors: true })
  }

  const startNewOrder = () => {
    setDraft(emptyDraft())
    setScreen({ name: 'form', showErrors: false })
  }

  const soldOutOnArrival = event.seatsLeft === 0 && screen.name === 'form'

  return (
    <main className="page">
      <EventHeader event={event} />
      {!soldOutOnArrival && <Stepper current={STEP_OF_SCREEN[screen.name]} />}
      <div ref={contentRef}>
        {soldOutOnArrival && <EventSoldOut />}
        {!soldOutOnArrival && screen.name === 'form' && (
          <ParticipantsForm
            draft={draft}
            seatsLeft={event.seatsLeft}
            showErrorsInitially={screen.showErrors}
            onChange={setDraft}
            onSubmit={(order) => setScreen({ name: 'review', order, submitting: false })}
          />
        )}
        {screen.name === 'review' && (
          <OrderReview
            order={screen.order}
            submitting={screen.submitting}
            error={screen.error}
            onEdit={() => setScreen({ name: 'form', showErrors: false })}
            onConfirm={() => confirm(screen.order)}
          />
        )}
        {screen.name === 'success' && (
          <OrderSuccess order={screen.order} orderNumber={screen.orderNumber} onNewOrder={startNewOrder} />
        )}
        {screen.name === 'sold_out' && (
          <OrderSoldOut
            order={screen.order}
            seatsLeft={screen.seatsLeft}
            onEdit={() => setScreen({ name: 'form', showErrors: true })}
            onRecheck={recheckSeats}
          />
        )}
      </div>
    </main>
  )
}

function useEvent(api: TicketApi) {
  const [event, setEvent] = useState<EventInfo>()
  const [failed, setFailed] = useState(false)

  const reload = useCallback(
    () =>
      api.getEvent().then(
        (loaded) => {
          setEvent(loaded)
          setFailed(false)
        },
        () => setFailed(true),
      ),
    [api],
  )

  useEffect(() => {
    reload()
  }, [reload])

  const setSeatsLeft = (seatsLeft: number) => setEvent((current) => current && { ...current, seatsLeft })

  return { event, failed, reload, setSeatsLeft }
}

function LoadError({ onRetry }: { onRetry(): void }) {
  return (
    <main className="page">
      <div className="card result" role="alert">
        <h2>Не удалось загрузить мероприятие</h2>
        <p>Проверьте интернет и попробуйте ещё раз.</p>
        <button type="button" className="button button--primary" onClick={onRetry}>
          Повторить
        </button>
      </div>
    </main>
  )
}

/**
 * При смене экрана переводит фокус (и прокрутку) на заголовок нового шага:
 * на телефоне он оказывается в начале экрана, скринридер его зачитывает.
 */
function useFocusHeadingOnChange<T extends HTMLElement>(key: string) {
  const ref = useRef<T>(null)
  const previousKey = useRef(key)

  useEffect(() => {
    if (previousKey.current === key) return
    previousKey.current = key
    const heading = ref.current?.querySelector('h2')
    heading?.setAttribute('tabindex', '-1')
    heading?.focus()
  }, [key])

  return ref
}
