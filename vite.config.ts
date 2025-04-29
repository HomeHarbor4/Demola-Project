import dotenv from 'dotenv';
dotenv.config(); // This is for vite.config to access process.env

// Import necessary functions and modules
import { defineConfig } from "vite"; // Core function from Vite to define the configuration object. Provides type safety and autocompletion.
import react from "@vitejs/plugin-react"; // The official Vite plugin for React projects. Enables features like Fast Refresh (HMR) and JSX transformation.
import themePlugin from "@replit/vite-plugin-shadcn-theme-json"; // A plugin likely specific to Replit environments, possibly for handling Shadcn UI theme configurations.
import path from "path"; // Node.js built-in module for working with file and directory paths (e.g., resolving absolute paths).
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal"; // Another Replit-specific plugin, likely used to display runtime errors in a more user-friendly modal during development.

// Export the configuration object as the default export
export default defineConfig({
  server: {
    allowedHosts: ['realestate-webapp.onrender.com']
  },
  // `plugins` is an array where you register Vite plugins to extend its functionality.
  plugins: [
    react(), // Initialize and add the React plugin.
    runtimeErrorOverlay(), // Initialize and add the runtime error overlay plugin.
    themePlugin(), // Initialize and add the Shadcn theme plugin.

    // This part conditionally adds another plugin based on the environment.
    ...( // The spread syntax (...) is used to merge the elements of the array returned by the conditional logic into the main plugins array.
      process.env.NODE_ENV !== "production" && // Check if the environment is NOT production (i.e., development)
      process.env.REPL_ID !== undefined // Check if the REPL_ID environment variable is set (indicating it's likely running on Replit).
        ? // If both conditions are true (development on Replit):
          [ // Create an array containing the dynamically imported plugin.
            await import("@replit/vite-plugin-cartographer").then((m) => // Asynchronously import the '@replit/vite-plugin-cartographer' module.
              m.cartographer(), // Once imported, call the 'cartographer' function from the module to get the plugin instance. This plugin is likely another Replit tool, perhaps for visualizing project structure or dependencies.
            ),
          ]
        : // If either condition is false (production or not on Replit):
          [] // Add an empty array, effectively adding no plugin.
    ),
  ],

  // `resolve` configures how Vite resolves module imports.
  resolve: {
    // `alias` creates shortcuts for import paths.
    alias: {
      // Maps "@" to the absolute path of the "client/src" directory.
      // `import.meta.dirname` gives the directory name of the current module (vite.config.ts).
      // `path.resolve` joins the segments into an absolute path.
      "@": path.resolve(import.meta.dirname, "client", "src"),
      // Maps "@shared" to the absolute path of the "shared" directory.
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },

  // `root` specifies the project root directory (where index.html is located).
  // Vite will serve files from this directory during development.
  root: path.resolve(import.meta.dirname, "client"),

  // `build` configures the production build process.
  build: {
    // `outDir` specifies the directory where the built files will be placed.
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    // `emptyOutDir: true` ensures that the output directory is cleared before each build.
    emptyOutDir: true,
  },
});
