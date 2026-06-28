const { Pool } = require('pg');

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const ssl = process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false };

const pool = hasDatabaseUrl
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl,
    })
  : null;

const memoryStore = [];
let memoryId = 1;

async function ensureTable() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS drinks (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      options JSONB NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      prep_time_minutes INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function mapRow(row) {
  return {
    id: row.id,
    name: row.name,
    options: row.options,
    price: Number(row.price),
    prepTimeMinutes: row.prep_time_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listDrinks() {
  if (!pool) {
    return [...memoryStore].sort((a, b) => b.id - a.id);
  }

  await ensureTable();
  const result = await pool.query('SELECT * FROM drinks ORDER BY created_at DESC;');
  return result.rows.map(mapRow);
}

async function getDrink(id) {
  if (!pool) {
    return memoryStore.find((item) => item.id === Number(id)) || null;
  }

  await ensureTable();
  const result = await pool.query('SELECT * FROM drinks WHERE id = $1;', [id]);
  return result.rows.length ? mapRow(result.rows[0]) : null;
}

async function createDrink(record) {
  if (!pool) {
    const now = new Date().toISOString();
    const item = {
      id: memoryId++,
      name: record.name,
      options: record.options,
      price: record.price,
      prepTimeMinutes: record.prepTimeMinutes,
      createdAt: now,
      updatedAt: now,
    };
    memoryStore.push(item);
    return item;
  }

  await ensureTable();
  const result = await pool.query(
    `INSERT INTO drinks (name, options, price, prep_time_minutes)
     VALUES ($1, $2, $3, $4)
     RETURNING *;`,
    [record.name, record.options, record.price, record.prepTimeMinutes],
  );
  return mapRow(result.rows[0]);
}

async function updateDrink(id, record) {
  if (!pool) {
    const index = memoryStore.findIndex((item) => item.id === Number(id));
    if (index === -1) return null;

    const updated = {
      ...memoryStore[index],
      name: record.name,
      options: record.options,
      price: record.price,
      prepTimeMinutes: record.prepTimeMinutes,
      updatedAt: new Date().toISOString(),
    };
    memoryStore[index] = updated;
    return updated;
  }

  await ensureTable();
  const result = await pool.query(
    `UPDATE drinks
     SET name = $1,
         options = $2,
         price = $3,
         prep_time_minutes = $4,
         updated_at = NOW()
     WHERE id = $5
     RETURNING *;`,
    [record.name, record.options, record.price, record.prepTimeMinutes, id],
  );
  return result.rows.length ? mapRow(result.rows[0]) : null;
}

async function deleteDrink(id) {
  if (!pool) {
    const index = memoryStore.findIndex((item) => item.id === Number(id));
    if (index === -1) return false;
    memoryStore.splice(index, 1);
    return true;
  }

  await ensureTable();
  const result = await pool.query('DELETE FROM drinks WHERE id = $1 RETURNING id;', [id]);
  return result.rowCount > 0;
}

module.exports = {
  listDrinks,
  getDrink,
  createDrink,
  updateDrink,
  deleteDrink,
};
