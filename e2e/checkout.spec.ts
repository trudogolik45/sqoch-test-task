import { type Page, expect, test } from '@playwright/test'

test.afterEach(async ({ page }, testInfo) => {
  const video = page.video()
  if (!video) return
  await page.close()
  await video.saveAs(`demo/${testInfo.project.name}-${testInfo.title}.webm`)
})

async function fillParticipant(page: Page, number: number, name: string, age: string) {
  const group = page.getByRole('group', { name: `Участник ${number}` })
  await group.getByLabel('Имя').fill(name)
  await group.getByLabel('Возраст').fill(age)
}

async function fillFamilyOrder(page: Page) {
  await page.goto('/')
  await fillParticipant(page, 1, 'Анна Смирнова', '35')
  await page.getByRole('button', { name: 'Добавить участника' }).click()
  await fillParticipant(page, 2, 'Миша', '7')
  await page.getByLabel('Email для билетов').fill('anna@example.com')
}

test('успешное оформление', async ({ page }) => {
  await page.goto('/')
  await fillParticipant(page, 1, 'Миша', '7')
  await page.getByRole('button', { name: 'Перейти к проверке' }).click()
  await expect(page.getByLabel('Email для билетов')).toHaveAccessibleDescription('Укажите email')
  await expect(page.getByRole('alert')).toContainText('от 18 лет')

  await fillFamilyOrder(page)
  await page.getByRole('button', { name: 'Перейти к проверке' }).click()
  await expect(page.getByTestId('order-total')).toHaveText(/3\s000\s₽/)

  await page.getByRole('button', { name: 'Изменить данные' }).click()
  await fillParticipant(page, 2, 'Миша', '15')
  await page.getByRole('button', { name: 'Перейти к проверке' }).click()
  await expect(page.getByTestId('order-total')).toHaveText(/4\s000\s₽/)

  await page.getByRole('button', { name: /Подтвердить и оплатить/ }).click()
  await expect(page.getByRole('heading', { name: 'Заказ SQ-1001 оформлен' })).toBeVisible()
  await expect(page.getByText('Осталось 48 мест')).toBeVisible()
})

test('места закончились перед подтверждением', async ({ page }) => {
  await fillFamilyOrder(page)
  await page.getByRole('button', { name: 'Перейти к проверке' }).click()

  await page.getByText('Демо: другие покупатели').click()
  await page.getByRole('button', { name: 'Оставить 1 место' }).click()
  await page.getByRole('button', { name: /Подтвердить и оплатить/ }).click()

  await expect(page.getByRole('heading', { name: 'Места закончились' })).toBeVisible()
  await page.getByRole('button', { name: 'Изменить состав заказа' }).click()
  await expect(page.getByRole('alert')).toContainText('Осталось мест: 1')
  await page.getByRole('button', { name: 'Удалить участника 2' }).click()
  await page.getByRole('button', { name: 'Перейти к проверке' }).click()
  await page.getByRole('button', { name: /Подтвердить и оплатить/ }).click()

  await expect(page.getByRole('heading', { name: 'Заказ SQ-1001 оформлен' })).toBeVisible()
})

test('распроданное мероприятие', async ({ page }) => {
  await page.goto('/?seats=0')

  await expect(page.getByRole('heading', { name: 'Билеты закончились' })).toBeVisible()
})

test('без горизонтальной прокрутки на каждом шаге', async ({ page }) => {
  const expectNoHorizontalScroll = async () => {
    const width = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(width).toBeLessThanOrEqual(page.viewportSize()!.width)
  }

  await fillFamilyOrder(page)
  await expectNoHorizontalScroll()
  await page.getByRole('button', { name: 'Перейти к проверке' }).click()
  await expectNoHorizontalScroll()
  await page.getByRole('button', { name: /Подтвердить и оплатить/ }).click()
  await expect(page.getByRole('heading', { name: /оформлен/ })).toBeVisible()
  await expectNoHorizontalScroll()
})
