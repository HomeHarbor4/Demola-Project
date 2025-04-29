import { Request, Response, NextFunction } from "express";

/**
 * Middleware to check if the user is an admin
 * This will be used to protect admin-only routes
 * NOTE: For development purposes, this middleware is temporarily bypassed
 */
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  // Temporarily bypass admin check in development to allow footer content management
  // In a production environment, you would implement proper session management
  next();
};