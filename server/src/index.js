require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { listDrinks, getDrink, createDrink, updateDrink, deleteDrink } = require('./data/drinksStore');
const { calculatePriceBreakdown, estimatePrepTimeMinutes } = require('./utils/pricing');
const { validateDrinkForSave } = require('./utils/validation');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/drinks', async (_req, res) => {
  const drinks = await listDrinks();
  const payload = drinks.map((drink) => ({
    ...drink,
    priceBreakdown: calculatePriceBreakdown(drink.options),
  }));
  res.json(payload);
});

app.get('/api/drinks/:id', async (req, res) => {
  const drink = await getDrink(req.params.id);
  if (!drink) {
    return res.status(404).json({ error: 'Drink not found.' });
  }

  return res.json({
    ...drink,
    priceBreakdown: calculatePriceBreakdown(drink.options),
  });
});

app.post('/api/drinks', async (req, res) => {
  const { name, options } = req.body || {};
  const validationError = validateDrinkForSave(name, options);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const priceBreakdown = calculatePriceBreakdown(options);
  const prepTimeMinutes = estimatePrepTimeMinutes(options);

  const created = await createDrink({
    name: String(name).trim(),
    options,
    price: priceBreakdown.total,
    prepTimeMinutes,
  });

  return res.status(201).json({ ...created, priceBreakdown });
});

app.put('/api/drinks/:id', async (req, res) => {
  const { name, options } = req.body || {};
  const validationError = validateDrinkForSave(name, options);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const existing = await getDrink(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Drink not found.' });
  }

  const priceBreakdown = calculatePriceBreakdown(options);
  const prepTimeMinutes = estimatePrepTimeMinutes(options);

  const updated = await updateDrink(req.params.id, {
    name: String(name).trim(),
    options,
    price: priceBreakdown.total,
    prepTimeMinutes,
  });

  return res.json({ ...updated, priceBreakdown });
});

app.delete('/api/drinks/:id', async (req, res) => {
  const deleted = await deleteDrink(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Drink not found.' });
  }

  return res.status(204).send();
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Unexpected server error.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Frost & Foam API listening on port ${PORT}`);
  });
}

module.exports = app;
