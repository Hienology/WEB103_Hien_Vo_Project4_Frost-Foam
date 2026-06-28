export const BASE_DRINKS = {
  milkshake: { label: 'Milkshake', price: 5.5, complexity: 1.2 },
  frappe: { label: 'Frappe', price: 5.75, complexity: 1.35 },
  iced_latte: { label: 'Iced Latte', price: 4.75, complexity: 1.0 },
  cream_soda: { label: 'Cream Soda', price: 4.5, complexity: 0.9 },
  matcha: { label: 'Matcha', price: 5.25, complexity: 1.1 },
}

export const FLAVORS = {
  vanilla: { label: 'Vanilla', price: 0.4 },
  caramel: { label: 'Caramel', price: 0.5 },
  hazelnut: { label: 'Hazelnut', price: 0.55 },
  mocha: { label: 'Mocha', price: 0.65 },
  strawberry: { label: 'Strawberry', price: 0.45 },
  matcha: { label: 'Matcha', price: 0.6 },
}

export const TOPPINGS = {
  whipped_cream: { label: 'Whipped Cream', price: 0.5 },
  boba: { label: 'Boba Pearls', price: 0.75 },
  jelly: { label: 'Jelly Cubes', price: 0.6 },
  chocolate_chips: { label: 'Chocolate Chips', price: 0.55 },
  cinnamon: { label: 'Cinnamon Dust', price: 0.3 },
}

export const SIZE_PRICES = { regular: 0, large: 1.25 }

export const SERVICE_DISCOUNTS = { dine_in: 0, take_home: 0.5 }

export const PREP_TIMING = {
  baseMinutes: 3,
  largeSizeMinutes: 1,
  toppingMinutes: 0.75,
  dineInMinutes: 0.5,
}
