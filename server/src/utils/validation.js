const { BASE_DRINKS, FLAVORS, TOPPINGS, RULES } = require('../config/catalog');

function validateDrinkForSave(name, options = {}) {
  if (!name || !String(name).trim()) {
    return 'Please provide a name for your custom drink.';
  }

  if (!BASE_DRINKS[options.base]) {
    return 'Please choose a valid base drink.';
  }

  if (!FLAVORS[options.flavor]) {
    return 'Please choose a valid flavor.';
  }

  if (!['regular', 'large'].includes(options.size)) {
    return 'Please choose a valid size.';
  }

  if (!['dine_in', 'take_home'].includes(options.serviceType)) {
    return 'Please choose a valid service type.';
  }

  const toppings = Array.isArray(options.toppings) ? options.toppings : [];
  const invalidTopping = toppings.find((t) => !TOPPINGS[t]);
  if (invalidTopping) {
    return 'One or more selected toppings are invalid.';
  }

  const disallowed = RULES.disallowedToppingsByBase[options.base] || [];
  const blockedTopping = toppings.find((t) => disallowed.includes(t));
  if (blockedTopping) {
    return `The topping "${TOPPINGS[blockedTopping].label}" is not compatible with ${BASE_DRINKS[options.base].label}.`;
  }

  if (options.serviceType === 'take_home' && toppings.length > RULES.maxTakeHomeToppings) {
    return `Take-home drinks can include at most ${RULES.maxTakeHomeToppings} toppings.`;
  }

  return null;
}

module.exports = {
  validateDrinkForSave,
};
