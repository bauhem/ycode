const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.SUPABASE_CONNECTION_URL });

// Fix the slug: remove leading slash from "/landing-page-test" → "landing-page-test"
pool.query(`
  UPDATE collection_item_values 
  SET value = 'landing-page-test', updated_at = NOW()
  WHERE value = '/landing-page-test'
  RETURNING id, value, is_published
`)
  .then(r => {
    console.log('Updated rows:', r.rows);
    pool.end();
  })
  .catch(e => {
    console.error(e.message);
    pool.end();
  });
