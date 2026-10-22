import { describe, expect, it } from 'vitest'
import { formatAge, formatRub, formatSeats } from './format'

describe('format', () => {
  it('пишет сумму в рублях с разрядами', () => {
    expect(formatRub(5000)).toMatch(/^5\s000\s₽$/)
  })

  it.each([
    [1, '1 год'],
    [3, '3 года'],
    [7, '7 лет'],
    [11, '11 лет'],
    [14, '14 лет'],
    [21, '21 год'],
    [42, '42 года'],
  ])('склоняет возраст %i', (age, text) => {
    expect(formatAge(age)).toBe(text)
  })

  it.each([
    [0, 'Мест нет'],
    [1, 'Осталось 1 место'],
    [4, 'Осталось 4 места'],
    [50, 'Осталось 50 мест'],
  ])('описывает остаток мест %i', (seats, text) => {
    expect(formatSeats(seats)).toBe(text)
  })
})
