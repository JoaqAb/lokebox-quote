import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { useEffect } from 'react'
import { formatCurrency } from '../pricing/format'
import type { CurrencyConfig } from '../types'

// Contador de precio animado. Anima entre el valor anterior y el nuevo en 350 ms.
// Con prefers-reduced-motion el valor cambia de golpe.
// Siempre formatea con formatCurrency: nunca muestra NaN ni un numero sin formato.

const DURATION_SECONDS = 0.35

type AnimatedAmountProps = {
  value: number
  currency: CurrencyConfig
  locale: string
}

function safe(value: number): number {
  return Number.isFinite(value) ? value : 0
}

export function AnimatedAmount({ value, currency, locale }: AnimatedAmountProps) {
  const target = safe(value)
  const reducedMotion = useReducedMotion()
  const amount = useMotionValue(target)
  const text = useTransform(amount, (current) => formatCurrency(safe(current), currency, locale))

  useEffect(() => {
    if (reducedMotion === true) {
      amount.set(target)
      return undefined
    }
    const controls = animate(amount, target, { duration: DURATION_SECONDS, ease: 'easeOut' })
    return () => {
      controls.stop()
    }
  }, [amount, reducedMotion, target])

  return <motion.span className="tabular-nums">{text}</motion.span>
}
