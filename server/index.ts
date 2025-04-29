// server/index.ts (dotenv loading removed)

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
// Remove Vite imports: import { setupVite, serveStatic, log } from "./vite";
import { storage, DatabaseStorage } from "./storage";
import { db } from "./db";
import cors from "cors";
import { env } from './config/env';
import adminRoutes from './routes/admin';

// Check DATABASE_URL *before* using it
if (!process.env.DATABASE_URL) {
   console.error("FATAL: DATABASE_URL is not set when server/index.ts runs. Check start.ts.");
   process.exit(1);
}

// Reimplement log function locally
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// Define allowed origins
const allowedOrigins = [
  'http://localhost:5173', // Your local development frontend
  'https://realestate-webapp.onrender.com', // Replace with your actual production URL
  // Add any other origins that need access
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true // Allow cookies and credentials
}));

// Logging middleware (keep using the local log function)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
  });
  next();
});

(async () => {
  // Initialize database and seed with sample data
  try {
    if (storage instanceof DatabaseStorage) {
      await storage.initializeDatabase();
      log("Database initialized with sample data");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }

  // Register all API routes
  await registerRoutes(app); // No longer returns a server

  // Routes
  app.use('/api/admin', adminRoutes);

  // Generic error handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`Error on ${req.method} ${req.path}:`, err);
    res.status(status).json({ message });
  });

  // Start the Express server directly using app.listen
  const PORT = env.PORT || 5000;
  app.listen(PORT, () => {
    log(`Server running on port ${PORT}`);
  });
})();
