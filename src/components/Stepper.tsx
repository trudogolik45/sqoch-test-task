const STEPS = ['Участники', 'Проверка', 'Готово'] as const

export type StepName = (typeof STEPS)[number]

export function Stepper({ current }: { current: StepName }) {
  const currentIndex = STEPS.indexOf(current)
  return (
    <ol className="stepper" aria-label="Шаги оформления">
      {STEPS.map((step, index) => (
        <li
          key={step}
          className={index <= currentIndex ? 'stepper__step stepper__step--done' : 'stepper__step'}
          aria-current={index === currentIndex ? 'step' : undefined}
        >
          <span className="stepper__number" aria-hidden="true">
            {index + 1}
          </span>
          {step}
        </li>
      ))}
    </ol>
  )
}
