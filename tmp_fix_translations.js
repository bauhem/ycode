const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.SUPABASE_CONNECTION_URL });

async function fix() {
  const enLocaleId = 'a28a2581-def2-4a6f-8f2e-478f61143f0d';
  
  // 1. Create PUB copies for drafts missing published versions
  console.log('=== Creating missing PUB copies ===');
  const r1 = await pool.query(`
    INSERT INTO translations (source_type, source_id, content_key, content_value, content_type, locale_id, is_published, is_completed)
    SELECT d.source_type, d.source_id, d.content_key, d.content_value, COALESCE(d.content_type, 'text'), d.locale_id, true, true
    FROM translations d
    WHERE d.is_published = false
      AND d.deleted_at IS NULL
      AND d.locale_id = $1
      AND NOT EXISTS (
        SELECT 1 FROM translations p
        WHERE p.source_id = d.source_id
          AND p.content_key = d.content_key
          AND p.locale_id = d.locale_id
          AND p.is_published = true
          AND p.deleted_at IS NULL
      )
    RETURNING content_key, source_type
  `, [enLocaleId]);
  console.log(`Created ${r1.rowCount} missing PUB translations`);
  r1.rows.slice(0, 10).forEach(r => console.log(`  ${r.source_type}: ${r.content_key?.substring(0, 60)}`));
  if (r1.rowCount > 10) console.log(`  ... and ${r1.rowCount - 10} more`);

  // 2. Update PUB copies where content differs from draft
  console.log('\n=== Updating stale PUB copies ===');
  const r2 = await pool.query(`
    UPDATE translations p
    SET content_value = d.content_value,
        content_type = COALESCE(d.content_type, p.content_type, 'text'),
        is_completed = true,
        deleted_at = NULL,
        updated_at = NOW()
    FROM translations d
    WHERE d.is_published = false
      AND d.deleted_at IS NULL
      AND d.locale_id = $1
      AND p.source_id = d.source_id
      AND p.content_key = d.content_key
      AND p.locale_id = d.locale_id
      AND p.is_published = true
      AND p.content_value IS DISTINCT FROM d.content_value
    RETURNING p.content_key, p.source_type, LEFT(d.content_value, 50) as new_val
  `, [enLocaleId]);
  console.log(`Updated ${r2.rowCount} stale PUB translations`);
  r2.rows.slice(0, 10).forEach(r => console.log(`  ${r.source_type}: ${r.content_key?.substring(0, 50)} => "${r.new_val}"`));
  if (r2.rowCount > 10) console.log(`  ... and ${r2.rowCount - 10} more`);

  // 3. Also fix any PUB translations that are deleted or incomplete (not matching any draft issue)
  console.log('\n=== Fixing deleted/incomplete PUB translations ===');
  const r3 = await pool.query(`
    UPDATE translations
    SET deleted_at = NULL, is_completed = true, updated_at = NOW()
    WHERE locale_id = $1
      AND is_published = true
      AND (deleted_at IS NOT NULL OR is_completed = false)
    RETURNING content_key
  `, [enLocaleId]);
  console.log(`Fixed ${r3.rowCount} deleted/incomplete PUB translations`);

  // 4. Verify
  const r4 = await pool.query(`
    SELECT 
      COUNT(*) FILTER (WHERE p.id IS NULL) as still_missing,
      COUNT(*) FILTER (WHERE p.id IS NOT NULL AND p.content_value != d.content_value) as still_different
    FROM translations d
    LEFT JOIN translations p ON p.source_id = d.source_id 
      AND p.content_key = d.content_key 
      AND p.locale_id = d.locale_id 
      AND p.is_published = true
      AND p.deleted_at IS NULL
    WHERE d.is_published = false
      AND d.deleted_at IS NULL
      AND d.locale_id = $1
  `, [enLocaleId]);
  console.log(`\nRemaining issues: missing=${r4.rows[0].still_missing}, different=${r4.rows[0].still_different}`);

  await pool.end();
  console.log('\nDone. Run Ycode publish + Netlify deploy to go live.');
}

fix().catch(e => { console.error(e); pool.end(); });
