const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.SUPABASE_CONNECTION_URL });

const compId = 'ef4a2d08-89e6-4603-9d36-a221afd0082f';

pool.query(`SELECT is_published, layers FROM components WHERE id = $1`, [compId])
  .then(r => {
    r.rows.forEach(row => {
      const jsonStr = JSON.stringify(row.layers);
      
      // Search for "Découvrez" anywhere in the JSON and show surrounding context
      let idx = jsonStr.indexOf('Découvrez');
      while (idx !== -1) {
        const start = Math.max(0, idx - 200);
        const end = Math.min(jsonStr.length, idx + 200);
        console.log(`\n  Context around "Découvrez" at position ${idx} (pub=${row.is_published}):`);
        console.log(`  ${jsonStr.substring(start, end)}`);
        idx = jsonStr.indexOf('Découvrez', idx + 1);
      }
      
      // Same for "Discover"
      idx = jsonStr.indexOf('Discover');
      while (idx !== -1) {
        const start = Math.max(0, idx - 200);
        const end = Math.min(jsonStr.length, idx + 200);
        console.log(`\n  Context around "Discover" at position ${idx} (pub=${row.is_published}):`);
        console.log(`  ${jsonStr.substring(start, end)}`);
        idx = jsonStr.indexOf('Discover', idx + 1);
      }
    });
    pool.end();
  })
  .catch(e => {
    console.error(e.message);
    pool.end();
  });
