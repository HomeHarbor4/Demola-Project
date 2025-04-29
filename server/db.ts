// server/db.ts

// Import the standard Node-Postgres pool
import { Pool } from 'pg';
// Import the Drizzle adapter for Node-Postgres
import { drizzle } from 'drizzle-orm/node-postgres';
// Import your Drizzle schema
import * as schema from "@shared/schema";
// Import environment configuration
import { env } from './config/env';

// --- Environment Variable Check ---
console.log("DATABASE_URL:", env.DATABASE_URL ? "Set" : "Not Set");
if (!env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable must be set for PostgreSQL connection.",
  );
}
// --- End Check ---

// --- Create the PostgreSQL Connection Pool ---
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // --- Add SSL configuration ---
  ssl: {
    // Set rejectUnauthorized based on your environment and certificate setup
    // - true: Requires a valid CA certificate (most secure, use in production if possible)
    // - false: Allows self-signed certificates (use for development or specific hosting like Heroku/Render if needed, less secure)
    rejectUnauthorized: env.NODE_ENV === 'production', // Example: true in prod, false in dev
    // You might need to provide ca, cert, key paths if your setup requires client certificates
    // ca: process.env.SSL_CA_PATH,
    // cert: process.env.SSL_CERT_PATH,
    // key: process.env.SSL_KEY_PATH,
  }
  // --- End SSL configuration ---
});

// --- Initialize Drizzle ORM (if using) ---
// If you are not using Drizzle, remove this line
export const db = drizzle(pool, { schema });

// --- Optional: Connection Test ---
pool.connect((err, client, release) => {
  if (err) {
    // Log the specific error during the connection test
    console.error('Error acquiring client for connection test:', err);
  } else {
    console.log('Successfully connected to PostgreSQL database via pg Pool (SSL should be active).');
    client?.query('SELECT NOW()', (err, result) => {
      release(); // Release the client back to the pool
      if (err) {
        console.error('Error executing test query:', err.stack);
      } else {
        console.log('Test query result:', result?.rows[0]);
      }
    });
  }
});

console.log("pg Pool initialized and exported with SSL config.");
