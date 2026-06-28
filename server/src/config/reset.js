const { pool } = require('./database.js');

const createTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS custom_drinks (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        selected_options JSONB NOT NULL,
        total_price NUMERIC(10,2) NOT NULL,
        estimated_ready_minutes INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Table "custom_drinks" created successfully (or already exists).');
  } catch (error) {
    console.error('❌ Error creating table:', error);
  } finally {
    await pool.end();
  }
};

createTable();