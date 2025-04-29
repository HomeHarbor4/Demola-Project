// server/start.ts
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { Pool } from 'pg';
import { CrimeDataService } from './services/crimeDataService';
import { env } from './config/env';

// --- Run the check before starting the main app ---
async function checkAndPushSchema() {
  console.log('Checking database schema...');
  const tempPool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: env.NODE_ENV === 'production' }
  });

  // List of essential tables defined in your shared/schema.ts
  const essentialTables = ['users', 'properties', 'locations', 'settings', 'messages', 'crime_data'];

  try {
    const client = await tempPool.connect();
    let schemaNeedsUpdate = false;

    try {
      console.log(`Verifying existence of tables: ${essentialTables.join(', ')}...`);
      const query = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = ANY($1::text[]);
      `;
      const { rows } = await client.query(query, [essentialTables]);
      const existingTables = rows.map(row => row.table_name);

      const missingTables = essentialTables.filter(table => !existingTables.includes(table));

      if (missingTables.length > 0) {
        console.warn(`Missing essential tables: ${missingTables.join(', ')}.`);
        schemaNeedsUpdate = true;
      } else {
        console.log('All essential tables found.');
      }

    } finally {
      client.release();
    }

    if (schemaNeedsUpdate) {
      console.log('Schema appears incomplete or outdated. Running drizzle-kit push...');
      try {
        execSync('npx drizzle-kit push', { stdio: 'inherit' });
        console.log('drizzle-kit push completed.');
      } catch (pushError) {
        console.error('Error running drizzle-kit push:', pushError);
        console.error("Please ensure drizzle-kit is installed and DATABASE_URL is correct.");
        process.exit(1);
      }
    } else {
      console.log('Schema appears up-to-date. Skipping push.');
    }

  } catch (error) {
    console.error('Error connecting to or checking database schema:', error);
    console.error("Please ensure the database is running and accessible.");
    process.exit(1);
  } finally {
    await tempPool.end();
  }
}

// Initialize the application
checkAndPushSchema()
  .then(() => {
    // Initialize crime data service after schema check
    console.log("Starting crime data service...");
    CrimeDataService.startScheduledUpdates();
    
    // --- NOW import and run the main application ---
    console.log("Proceeding to start main application...");
    return import('./index.js');
  })
  .then(module => {
    console.log("Main application module (server/index.ts) loaded.");
  })
  .catch(err => {
    console.error("Failed during startup:", err);
    process.exit(1);
  });
