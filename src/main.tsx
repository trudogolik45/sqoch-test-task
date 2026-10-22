import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createTicketApi } from './api/ticketApi'
import { DemoPanel } from './components/DemoPanel'

const DEFAULT_SEATS = 50
const NETWORK_DELAY_MS = 700

/** `?seats=N` задаёт стартовый остаток мест, например `?seats=0` — распроданное мероприятие. */
function initialSeats(): number {
  const seats = Number(new URLSearchParams(window.location.search).get('seats') ?? DEFAULT_SEATS)
  return Number.isInteger(seats) && seats >= 0 ? seats : DEFAULT_SEATS
}

const api = createTicketApi({ seatsLeft: initialSeats(), delayMs: NETWORK_DELAY_MS })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App api={api} />
    <DemoPanel api={api} />
  </StrictMode>,
)
