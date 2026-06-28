import {
  BASE_DRINKS,
  FLAVORS,
  TOPPINGS,
  SIZE_PRICES,
  SERVICE_DISCOUNTS,
  PREP_TIMING,
} from '../config/catalog'

const toMoney = (value) => Math.round(value * 100) / 100

export function calculatePriceBreakdown(options = {}) {
  const base = BASE_DRINKS[options.base]
  if (!base) return null

  const flavor = FLAVORS[options.flavor] || { label: 'None', price: 0 }
  const size = options.size === 'large' ? 'large' : 'regular'
  const toppings = Array.isArray(options.toppings) ? options.toppings : []
  const serviceType = options.serviceType === 'take_home' ? 'take_home' : 'dine_in'

  const toppingsTotal = toppings
    .map((id) => TOPPINGS[id]?.price || 0)
    .reduce((sum, value) => sum + value, 0)

  const subtotal = base.price + flavor.price + SIZE_PRICES[size] + toppingsTotal
  const discount = SERVICE_DISCOUNTS[serviceType] || 0
  const total = Math.max(0, subtotal - discount)

  return {
    base: { label: base.label, amount: toMoney(base.price) },
    flavor: { label: flavor.label, amount: toMoney(flavor.price) },
    size: { label: size === 'large' ? 'Large' : 'Regular', amount: toMoney(SIZE_PRICES[size]) },
    toppings: toppings
      .map((id) => TOPPINGS[id])
      .filter(Boolean)
      .map((topping) => ({ label: topping.label, amount: toMoney(topping.price) })),
    discount: {
      label: serviceType === 'take_home' ? 'Take-home discount' : 'No discount',
      amount: toMoney(discount),
    },
    subtotal: toMoney(subtotal),
    total: toMoney(total),
  }
}

export function estimatePrepTime(options = {}) {
  const base = BASE_DRINKS[options.base]
  if (!base) return 0

  const toppingsCount = Array.isArray(options.toppings) ? options.toppings.length : 0
  const isLarge = options.size === 'large'
  const isDineIn = options.serviceType !== 'take_home'

  return Math.ceil(
    PREP_TIMING.baseMinutes +
      base.complexity +
      (isLarge ? PREP_TIMING.largeSizeMinutes : 0) +
      toppingsCount * PREP_TIMING.toppingMinutes +
      (isDineIn ? PREP_TIMING.dineInMinutes : 0),
  )
}
