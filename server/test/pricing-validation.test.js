const test = require('node:test');
const assert = require('node:assert/strict');

const { calculatePriceBreakdown, estimatePrepTimeMinutes } = require('../src/utils/pricing');
const { validateDrinkForSave } = require('../src/utils/validation');

test('calculatePriceBreakdown includes all components and take-home discount', () => {
  const breakdown = calculatePriceBreakdown({
    base: 'frappe',
    flavor: 'mocha',
    size: 'large',
    toppings: ['boba', 'cinnamon'],
    serviceType: 'take_home',
  });

  assert.equal(breakdown.subtotal, 8.7);
  assert.equal(breakdown.discount.amount, 0.5);
  assert.equal(breakdown.total, 8.2);
  assert.equal(breakdown.toppings.length, 2);
});

test('estimatePrepTimeMinutes rounds up based on complexity and options', () => {
  const minutes = estimatePrepTimeMinutes({
    base: 'milkshake',
    flavor: 'vanilla',
    size: 'large',
    toppings: ['boba', 'jelly', 'cinnamon'],
    serviceType: 'dine_in',
  });

  assert.equal(minutes, 8);
});

test('validateDrinkForSave rejects incompatible and overloaded combinations on save', () => {
  const invalidByCompatibility = validateDrinkForSave('My Drink', {
    base: 'cream_soda',
    flavor: 'vanilla',
    size: 'regular',
    toppings: ['whipped_cream'],
    serviceType: 'dine_in',
  });

  assert.match(invalidByCompatibility, /not compatible/i);

  const invalidByTakeHomeToppings = validateDrinkForSave('My Drink', {
    base: 'frappe',
    flavor: 'mocha',
    size: 'regular',
    toppings: ['boba', 'jelly', 'chocolate_chips', 'cinnamon'],
    serviceType: 'take_home',
  });

  assert.match(invalidByTakeHomeToppings, /at most 3 toppings/i);
});

test('validateDrinkForSave allows exploratory combos that pass final rules', () => {
  const error = validateDrinkForSave('Sunset Foam', {
    base: 'matcha',
    flavor: 'matcha',
    size: 'regular',
    toppings: ['boba'],
    serviceType: 'take_home',
  });

  assert.equal(error, null);
});
