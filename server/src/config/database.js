require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'false' 
    ? false 
    : { rejectUnauthorized: false }
});

module.exports = { pool };