const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.SUPABASE_CONNECTION_URL });

const content = `# Bauhem — Agence digitale spécialisée

> Bauhem conçoit des sites, portails et systèmes web structurés pour aider les PME à être mieux comprises par leurs clients, Google et les outils d'IA.

## Services
- SEO, AEO & Découvrabilité: https://admin.bauhem.com/services/seo-aeo-decouvrabilite
- Systèmes web & CMS composables: https://admin.bauhem.com/services/systemes-web-cms-composables
- Design & Branding: https://admin.bauhem.com/services/design-branding
- Implémentation IA agentic: https://admin.bauhem.com/services/agentic-ai-implementation-entreprise
- Optimisation des processus: https://admin.bauhem.com/services/optimisation-processus
- Développement assisté par IA: https://admin.bauhem.com/services/developpement-applications-assiste-ia

## Solutions
- Portails clients, employés & outils internes: https://admin.bauhem.com/solutions/portails-clients-employes-outils-internes
- Sites structurés & découvrabilité: https://admin.bauhem.com/solutions/sites-structures-decouvrabilite
- Automatisation, processus & données: https://admin.bauhem.com/solutions/automatisation-processus-donnees
- Migration Ycode & systèmes composables: https://admin.bauhem.com/solutions/migration-ycode-systemes-composables
- Modernisation de systèmes vieillissants: https://admin.bauhem.com/solutions/modernisation-sites-systemes-vieillissants
- Branding, structure & contenu: https://admin.bauhem.com/solutions/branding-structure-contenu

## Réalisations
- https://admin.bauhem.com/realisations

## À propos
- https://admin.bauhem.com/a-propos

## Contact
- https://admin.bauhem.com/contact

## Blogue
- https://admin.bauhem.com/blog

Dernière mise à jour: 2026-06-06
`;

// First check the column type
pool.query("SELECT key, pg_typeof(value) as val_type FROM settings WHERE key = 'llms_txt'")
  .then(r => {
    console.log('Column type:', r.rows[0]);
    // Use to_jsonb for JSONB columns
    if (r.rows[0] && r.rows[0].val_type === 'jsonb') {
      return pool.query(
        "UPDATE settings SET value = to_jsonb($1::text) WHERE key = 'llms_txt'",
        [content]
      );
    } else {
      return pool.query(
        "UPDATE settings SET value = $1 WHERE key = 'llms_txt'",
        [content]
      );
    }
  })
  .then(r => {
    console.log('Updated:', r.rowCount, 'rows');
    return pool.query("SELECT key, length(value::text) as len FROM settings WHERE key = 'llms_txt'");
  })
  .then(r => {
    console.log('Verification:', r.rows[0]);
    pool.end();
  })
  .catch(e => {
    console.error(e.message);
    pool.end();
  });
