import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const envPath = path.resolve(projectRoot, '.env');

const dotenvResult = dotenv.config({ path: envPath });

if (dotenvResult.error) {
  console.error("FATAL: Error loading .env file:", dotenvResult.error);
  process.exit(1);
} else {
  console.log(".env file loaded successfully from:", envPath);
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded' : 'Not Loaded');
}

// Export environment variables
export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '5000',
}; 