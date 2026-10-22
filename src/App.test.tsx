import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { createTicketApi } from './api/ticketApi'

function setup(seatsLeft = 50) {
  const api = createTicketApi({ seatsLeft, delayMs: 0 })
  const user = userEvent.setup()
  render(<App api={api} />)
  return { api, user }
}

const participantGroup = (number: number) => screen.getByRole('group', { name: `Участник ${number}` })

async function fillParticipant(user: ReturnType<typeof userEvent.setup>, number: number, name: string, age: string) {
  const group = participantGroup(number)
  await user.clear(within(group).getByLabelText('Имя'))
  await user.type(within(group).getByLabelText('Имя'), name)
  await user.clear(within(group).getByLabelText('Возраст'))
  await user.type(within(group).getByLabelText('Возраст'), age)
}

async function fillFamilyOrder(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole('heading', { name: 'Участники' })
  await fillParticipant(user, 1, 'Анна', '35')
  await user.click(screen.getByRole('button', { name: 'Добавить участника' }))
  await fillParticipant(user, 2, 'Миша', '7')
  await user.type(screen.getByLabelText('Email для билетов'), 'anna@example.com')
}

const goToReview = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Перейти к проверке' }))

describe('оформление билетов', () => {
  it('проводит от заполнения участников до подтверждённого заказа', async () => {
    const { user } = setup()
    await fillFamilyOrder(user)

    await goToReview(user)

    const review = screen.getByRole('region', { name: 'Состав заказа' })
    expect(within(review).getByText('Анна')).toBeInTheDocument()
    expect(within(review).getByText(/35 лет · полный/)).toBeInTheDocument()
    expect(within(review).getByText(/7 лет · детский/)).toBeInTheDocument()
    expect(within(review).getByText('anna@example.com')).toBeInTheDocument()
    expect(within(review).getByTestId('order-total')).toHaveTextContent(/^3\s000\s₽$/)

    await user.click(screen.getByRole('button', { name: /Подтвердить и оплатить/ }))

    expect(await screen.findByRole('heading', { name: 'Заказ SQ-1001 оформлен' })).toBeInTheDocument()
    expect(screen.getByText(/anna@example\.com/)).toBeInTheDocument()
  })

  it('показывает цену билета по возрасту прямо в форме', async () => {
    const { user } = setup()
    await screen.findByRole('heading', { name: 'Участники' })

    await fillParticipant(user, 1, 'Миша', '13')

    expect(within(participantGroup(1)).getByText(/Детский билет · 1\s000\s₽/)).toBeInTheDocument()
  })

  it('не пускает дальше с пустыми полями и подсвечивает ошибки', async () => {
    const { user } = setup()
    await screen.findByRole('heading', { name: 'Участники' })

    await goToReview(user)

    expect(within(participantGroup(1)).getByLabelText('Имя')).toHaveAccessibleDescription('Укажите имя')
    expect(within(participantGroup(1)).getByLabelText('Возраст')).toHaveAccessibleDescription('Укажите возраст')
    expect(screen.getByLabelText('Email для билетов')).toHaveAccessibleDescription('Укажите email')
    expect(within(participantGroup(1)).getByLabelText('Имя')).toHaveFocus()
    expect(screen.getByRole('heading', { name: 'Участники' })).toBeInTheDocument()
  })

  it('не оформляет ребёнка без взрослого от 18 лет', async () => {
    const { user } = setup()
    await screen.findByRole('heading', { name: 'Участники' })
    await fillParticipant(user, 1, 'Миша', '7')
    await user.type(screen.getByLabelText('Email для билетов'), 'anna@example.com')

    await goToReview(user)

    expect(screen.getByRole('alert')).toHaveTextContent('только вместе с участником от 18 лет')
  })

  it('разрешает не больше 4 участников и удалять лишних', async () => {
    const { user } = setup()
    await screen.findByRole('heading', { name: 'Участники' })
    const addButton = screen.getByRole('button', { name: 'Добавить участника' })

    for (let i = 0; i < 3; i++) await user.click(addButton)

    expect(addButton).toBeDisabled()
    await user.click(within(participantGroup(4)).getByRole('button', { name: 'Удалить участника 4' }))
    expect(screen.queryByRole('group', { name: 'Участник 4' })).not.toBeInTheDocument()
    expect(addButton).toBeEnabled()
  })

  it('возвращает к форме с сохранёнными данными и пересчитывает сумму', async () => {
    const { user } = setup()
    await fillFamilyOrder(user)
    await goToReview(user)

    await user.click(screen.getByRole('button', { name: 'Изменить данные' }))
    expect(within(participantGroup(2)).getByLabelText('Имя')).toHaveValue('Миша')
    await fillParticipant(user, 2, 'Миша', '14')
    await goToReview(user)

    expect(screen.getByTestId('order-total')).toHaveTextContent(/^4\s000\s₽$/)
  })

  it('сообщает, что места закончились перед подтверждением, и даёт уменьшить заказ', async () => {
    const { api, user } = setup()
    await fillFamilyOrder(user)
    await goToReview(user)
    api.setSeatsLeft(1)

    await user.click(screen.getByRole('button', { name: /Подтвердить и оплатить/ }))

    expect(await screen.findByRole('heading', { name: 'Места закончились' })).toBeInTheDocument()
    expect(screen.getByText(/Осталось мест: 1/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Изменить состав заказа' }))
    expect(screen.getByText(/Осталось мест: 1/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Добавить участника' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Удалить участника 2' }))
    await goToReview(user)
    await user.click(screen.getByRole('button', { name: /Подтвердить и оплатить/ }))

    expect(await screen.findByRole('heading', { name: 'Заказ SQ-1001 оформлен' })).toBeInTheDocument()
  })

  it('честно говорит, что билетов не осталось совсем', async () => {
    const { api, user } = setup()
    await fillFamilyOrder(user)
    await goToReview(user)
    api.setSeatsLeft(0)

    await user.click(screen.getByRole('button', { name: /Подтвердить и оплатить/ }))

    expect(await screen.findByRole('heading', { name: 'Места закончились' })).toBeInTheDocument()
    expect(screen.getByText(/Все билеты раскуплены/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Изменить состав заказа' })).not.toBeInTheDocument()
  })

  it('сообщает о распроданном мероприятии сразу при открытии', async () => {
    setup(0)

    expect(await screen.findByRole('heading', { name: 'Билеты закончились' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Перейти к проверке' })).not.toBeInTheDocument()
  })
})
