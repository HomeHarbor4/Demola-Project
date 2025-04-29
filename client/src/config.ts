// src/config.ts

// Read the backend API URL from environment variables.
// VITE_API_BASE_URL should be defined in your .env file(s).
// Provide a default for local development if it's not set.
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// You can add other configuration settings here as needed
const config = {
  apiBaseUrl: API_BASE_URL,
  // Example: Add other settings if needed
  // defaultTimeout: 5000,
};

console.log(`Using API Base URL: ${config.apiBaseUrl}`); // Optional: Log for debugging

export default config;
