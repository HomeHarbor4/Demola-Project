import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage"; // Keep storage for other potential user methods if needed
import { users, insertUserSchema, type User } from '@shared/schema'; // Drizzle table and Zod schema
import { z } from "zod";
import { db } from '../db';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcrypt'; // For password hashing

const router = Router();

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Schema for Login
const loginSchema = z.object({
  // Allow login with either username or email
  usernameOrEmail: z.string().min(1, "Username or Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Schema for Registration (extends base insert schema, adds password, restricts role)
const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(['user', 'agent'], { // Only allow 'user' or 'agent' for self-registration
    errorMap: () => ({ message: "Invalid role specified for registration." })
  }).default('user'),
  // Add confirmPassword for frontend validation, but don't use it on backend
  // confirmPassword: z.string().min(6)
})
// .refine(data => data.password === data.confirmPassword, { // Frontend should handle this check
//   message: "Passwords don't match",
//   path: ["confirmPassword"],
// });

// Schema for Firebase Authentication
const firebaseAuthSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  uid: z.string().min(1, "Firebase UID is required"), // Firebase user ID
  photoURL: z.string().url("Invalid photo URL").optional().nullable(),
});

/**
 * @route GET /api/users/profile
 * @desc Get a user's profile by email (can be used by frontend after auth)
 */
router.get("/profile", asyncHandler(async (req: Request, res: Response) => {
  const email = req.query.email as string;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email query parameter is required" });
  }

  const [user] = await db.select({ // Select specific fields
      id: users.id, name: users.name, email: users.email, username: users.username,
      role: users.role, phone: users.phone, photoURL: users.photoURL, createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  res.json({ success: true, user: user });
}));

/**
 * @route GET /api/users/current
 * @desc Get current user data (Placeholder - requires actual session/token auth)
 */
router.get("/current", asyncHandler(async (req: Request, res: Response) => {
  // !! IMPORTANT: Replace this with your actual authentication mechanism !!
  // This example uses a query param, which is NOT secure for identifying the current user.
  // Use session data (e.g., req.session.userId) or JWT verification instead.
  const userId = req.query.userId as string; // EXAMPLE ONLY - DO NOT USE IN PRODUCTION

  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const idNum = parseInt(userId);
  if (isNaN(idNum)) {
     return res.status(400).json({ error: "Invalid user ID" });
  }

  const [user] = await db.select({
      id: users.id, name: users.name, email: users.email, username: users.username,
      role: users.role, phone: users.phone, photoURL: users.photoURL, createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.id, idNum))
    .limit(1);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
}));

/**
 * @route POST /api/users/login
 * @desc Login user with username/email and password (works for user, agent, admin)
 */
router.post("/login", asyncHandler(async (req: Request, res: Response) => {
  console.log("Handling POST /api/users/login");
  const validationResult = loginSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ success: false, message: "Invalid input", details: validationResult.error.errors });
  }

  const { usernameOrEmail, password } = validationResult.data;

  // Find user by username or email
  const [foundUser] = await db.select()
    .from(users)
    .where(or(
      eq(users.username, usernameOrEmail),
      eq(users.email, usernameOrEmail)
    ))
    .limit(1);

  // Check if user exists and has a password set (ruling out Firebase-only users without password)
  if (!foundUser || !foundUser.hashedPassword) {
    console.log(`Login failed: User not found or no password set for ${usernameOrEmail}`);
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  // Compare the provided password with the stored hash
  const passwordMatch = await bcrypt.compare(password, foundUser.hashedPassword);

  if (!passwordMatch) {
    console.log(`Login failed: Password mismatch for ${usernameOrEmail}`);
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  console.log(`Login successful for ${usernameOrEmail}`);
  // Exclude password hash from the response
  const { hashedPassword, ...userToReturn } = foundUser;
  res.json({ success: true, user: userToReturn });
}));

/**
 * @route POST /api/users/register
 * @desc Register a new user (allows 'user' or 'agent' roles only)
 */
router.post("/register", asyncHandler(async (req: Request, res: Response) => {
  console.log("Handling POST /api/users/register");
  const validationResult = registerSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ success: false, message: "Validation failed", details: validationResult.error.errors });
  }

  const { password, ...userData } = validationResult.data;

  // Check if username or email already exists
  const [existingUser] = await db.select({ id: users.id })
    .from(users)
    .where(or(
      eq(users.email, userData.email),
      eq(users.username, userData.username)
    ))
    .limit(1);

  if (existingUser) {
    console.log(`Registration failed: Username or email already exists for ${userData.username}/${userData.email}`);
    return res.status(409).json({ // 409 Conflict
      success: false,
      message: "Username or email already exists. Please choose different ones or sign in.",
    });
  }

  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  console.log("Password hashed successfully for new user");

  // Prepare data for insertion
  const userToInsert: Omit<typeof users.$inferInsert, 'id' | 'createdAt' | 'updatedAt'> = {
    ...userData, // Includes name, email, username, role, phone, photoURL, firebaseUid (all optional except name, email, username, role)
    hashedPassword: hashedPassword, // Use the hashed password
    phone: userData.phone || null,
    photoURL: userData.photoURL || null,
    firebaseUid: userData.firebaseUid || null,
  };

  // Insert the new user
  const [newUser] = await db.insert(users)
    .values(userToInsert)
    .returning({ // Return necessary fields (exclude password)
      id: users.id,
      name: users.name,
      email: users.email,
      username: users.username,
      role: users.role,
      phone: users.phone,
      photoURL: users.photoURL,
      createdAt: users.createdAt,
    });

  console.log(`User registered successfully: ${newUser.username} (Role: ${newUser.role})`);
  res.status(201).json({ // 201 Created
    success: true,
    message: "User registered successfully",
    user: newUser,
  });
}));

// --- Debug Route (Remove in production) ---
router.get("/debug", asyncHandler(async (req: Request, res: Response) => {
  console.warn("Accessing DEBUG route /api/users/debug");
  const allUsers = await db.select({
      id: users.id, username: users.username, name: users.name, email: users.email,
      role: users.role, createdAt: users.createdAt, firebaseUid: users.firebaseUid
    })
    .from(users);
  res.json(allUsers);
}));

/**
 * @route POST /api/users/logout
 * @desc Logout user (Placeholder - depends on auth strategy)
 */
router.post("/logout", (req: Request, res: Response) => {
  // If using sessions: req.session.destroy(...)
  // If using JWT: Client-side should discard the token. Backend might blacklist it.
  console.log("Handling POST /api/users/logout");
  res.json({ success: true, message: "Logout successful (client should clear token/session)" });
});

/**
 * @route POST /api/users/firebase-auth
 * @desc Authenticate or create user from Firebase credentials (Google Auth)
 */
router.post("/firebase-auth", asyncHandler(async (req: Request, res: Response) => {
  console.log("Handling POST /api/users/firebase-auth");
  const validationResult = firebaseAuthSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ success: false, message: "Invalid input", details: validationResult.error.errors });
  }

  const { email, name, uid, photoURL } = validationResult.data;

  // Check if user exists by email
  const [existingUser] = await db.select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userToReturn: Omit<User, 'hashedPassword'>;

  if (existingUser) {
    // User exists, potentially update details and ensure Firebase UID is linked
    console.log(`Firebase Auth: Found existing user by email: ${email}`);
    const updateData: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };
    let needsUpdate = false;

    // Link Firebase UID if not already linked or different
    if (existingUser.firebaseUid !== uid) {
      updateData.firebaseUid = uid;
      needsUpdate = true;
      console.log(`Firebase Auth: Linking/Updating Firebase UID for ${email}`);
    }
    // Optionally update name/photo if they differ (or if missing)
    if (name && existingUser.name !== name) {
      updateData.name = name;
      needsUpdate = true;
    }
    if (photoURL && existingUser.photoURL !== photoURL) {
      updateData.photoURL = photoURL;
      needsUpdate = true;
    }

    if (needsUpdate) {
      const [updatedUser] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, existingUser.id))
        .returning();
      const { hashedPassword, ...rest } = updatedUser || existingUser; // Use updated or existing if update failed somehow
      userToReturn = rest;
    } else {
      const { hashedPassword, ...rest } = existingUser;
      userToReturn = rest;
    }

  } else {
    // User doesn't exist, create a new one
    console.log(`Firebase Auth: Creating new user for email: ${email}`);
    // Generate a unique username based on email/name to avoid conflicts
    let baseUsername = name ? name.toLowerCase().replace(/[^a-z0-9]/g, '') : email.split('@')[0];
    let username = baseUsername;
    let counter = 1;
    let usernameExists = true;
    while(usernameExists) {
        const [check] = await db.select({id: users.id}).from(users).where(eq(users.username, username)).limit(1);
        if (!check) {
            usernameExists = false;
        } else {
            username = `${baseUsername}${counter++}`;
        }
    }

    const userToInsert: Omit<typeof users.$inferInsert, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name,
      email: email,
      username: username, // Use the generated unique username
      hashedPassword: null, // No password needed for Firebase-only auth
      phone: null,
      role: 'user', // Default role for Firebase sign-ups
      photoURL: photoURL || null,
      firebaseUid: uid, // Link the Firebase UID
    };

    const [newUser] = await db.insert(users)
      .values(userToInsert)
      .returning();

    const { hashedPassword, ...rest } = newUser;
    userToReturn = rest;
    console.log(`Firebase Auth: New user created: ${userToReturn.username}`);
  }

  res.json({ success: true, user: userToReturn });
}));

/**
 * @route GET /api/users/agents
 * @desc Get all users with the 'agent' role
 */
router.get('/agents', asyncHandler(async (req, res) => {
  console.log("Handling GET /api/users/agents");
  const agents = await db.select({
      // Select fields relevant for displaying agents
      id: users.id, name: users.name, email: users.email, phone: users.phone,
      role: users.role, photoURL: users.photoURL
      // Add other fields like bio, expertise if they exist in your schema
    })
    .from(users)
    .where(eq(users.role, 'agent'))
    .orderBy(users.name); // Order alphabetically by name

  res.json(agents);
}));


export default router;