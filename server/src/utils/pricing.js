const {
  BASE_DRINKS,
  FLAVORS,
  TOPPINGS,
  SIZE_PRICES,
  SERVICE_DISCOUNTS,
  PREP_TIMING,
} = require('../config/catalog');

function toMoney(value) {
  return Math.round(value * 100) / 100;
}

function calculatePriceBreakdown(options = {}) {
  const base = BASE_DRINKS[options.base];
  if (!base) {
    throw new Error('Invalid base drink selection.');
  }

  const flavor = FLAVORS[options.flavor] || { label: 'None', price: 0 };
  const size = options.size === 'large' ? 'large' : 'regular';
  const toppings = Array.isArray(options.toppings) ? options.toppings : [];
  const serviceType = options.serviceType === 'take_home' ? 'take_home' : 'dine_in';

  let toppingsTotal = 0;
  for (const toppingId of toppings) {
    const topping = TOPPINGS[toppingId];
    if (topping) {
      toppingsTotal += topping.price;
    }
  }

  const discount = SERVICE_DISCOUNTS[serviceType] || 0;
  const subtotal = base.price + flavor.price + SIZE_PRICES[size] + toppingsTotal;
  const total = Math.max(0, subtotal - discount);

  return {
    base: { label: base.label, amount: toMoney(base.price) },
    flavor: { label: flavor.label, amount: toMoney(flavor.price) },
    size: { label: size === 'large' ? 'Large' : 'Regular', amount: toMoney(SIZE_PRICES[size]) },
    toppings: toppings
      .map((id) => TOPPINGS[id])
      .filter(Boolean)
      .map((t) => ({ label: t.label, amount: toMoney(t.price) })),
    discount: {
      label: serviceType === 'take_home' ? 'Take-home discount' : 'No discount',
      amount: toMoney(discount),
    },
    subtotal: toMoney(subtotal),
    total: toMoney(total),
  };
}

function estimatePrepTimeMinutes(options = {}) {
  const base = BASE_DRINKS[options.base];
  if (!base) {
    throw new Error('Invalid base drink selection.');
  }

  const toppings = Array.isArray(options.toppings) ? options.toppings : [];
  const serviceType = options.serviceType === 'take_home' ? 'take_home' : 'dine_in';
  const isLarge = options.size === 'large';

  const rawMinutes =
    PREP_TIMING.baseMinutes +
    base.complexity +
    (isLarge ? PREP_TIMING.largeSizeMinutes : 0) +
    toppings.length * PREP_TIMING.toppingMinutes +
    (serviceType === 'dine_in' ? PREP_TIMING.dineInMinutes : 0);

  return Math.ceil(rawMinutes);
}

module.exports = {
  calculatePriceBreakdown,
  estimatePrepTimeMinutes,
};
