import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb, varchar,uniqueIndex, decimal   } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema  } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  hashedPassword: text("hashed_password"), // Nullable if using external providers like Google
  phone: text("phone"),
  role: text("role").default('user').notNull(), // 'user', 'agent', 'admin'
  photoURL: text("photo_url"), // For profile pictures (e.g., from Google)
  firebaseUid: text("firebase_uid").unique(), // For linking Firebase accounts
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    // Optional: Add indexes for faster lookups
    emailIdx: uniqueIndex("email_idx").on(table.email),
    usernameIdx: uniqueIndex("username_idx").on(table.username),
  };
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// --- Zod Schema for User Insertion (used as base for sign-up) ---
// Note: hashedPassword is omitted as it's handled separately
export const insertUserSchema = createInsertSchema(users, {
  // Add specific Zod validations here if needed beyond DB constraints
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(['user', 'agent', 'admin']).default('user'), // Ensure role is one of these
  phone: z.string().optional(),
  photoURL: z.string().url().optional(),
  firebaseUid: z.string().optional(),
}).omit({ id: true, hashedPassword: true, createdAt: true, updatedAt: true });

// Property model
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  area: doublePrecision("area").notNull(), // in sq.ft
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  postalCode: text('postal_code'),
  propertyType: text("property_type").notNull(), // apartment, villa, plot, commercial
  listingType: text("listing_type").notNull(), // buy, rent, pg
  features: text("features").array(), // swimming pool, gym, etc.
  images: text("images").array(), // URLs of images
  userId: integer("user_id").notNull(), // Owner/agent who posted
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  featured: boolean("featured").default(false),
  verified: boolean("verified").default(false),
  status: text("status").default("active").notNull(), // active, sold, rented
  transactionType: text("transaction_type").default("new"), // new, resale
  propertyOwnership: text("property_ownership").default("freehold"), // freehold, leasehold
  flooringDetails: text("flooring_details"), // e.g., "Marble in living room, wooden in bedrooms"
  furnishingDetails: text("furnishing_details"), // e.g., "Fully furnished, Semi-furnished, Unfurnished"
  heatingAvailable: boolean("heating_available").default(false),
  waterDetails: text("water_details"), // e.g., "24x7 water supply, corporation water"
  gasDetails: text("gas_details"), // e.g., "Piped gas, LPG connection"
  ownerDetails: jsonb("owner_details"), // JSON containing owner information
  averageNearbyPrices: doublePrecision("average_nearby_prices"), // Average price of nearby properties
  registrationDetails: text("registration_details"), // Property registration information
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  featured: true,
  verified: true,
});

// Location model (for popular locations)
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  city: text("city").notNull(),
  country: text("country").default("Finland").notNull(),
  image: text("image").notNull(),
  description: text("description"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  propertyCount: integer("property_count").default(0),
  municipalityCode: text("municipality_code"), // Add municipality code field
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
});

// Favorites model
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  propertyId: integer("property_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

// Messages model
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").default("unread").notNull(), // unread, read, replied
  propertyId: integer("property_id"),
  userId: integer("user_id"), // The user who received the message (e.g., property owner)
  senderUserId: integer("sender_user_id"), // The user who sent the message (if authenticated)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  status: true,
});

// Define message relations
export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [messages.propertyId],
    references: [properties.id],
  }),
  sender: one(users, {
    fields: [messages.senderUserId],
    references: [users.id],
    relationName: "messageSender",
  }),
}));

// Add messages relation to users
// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  favorites: many(favorites),
  receivedMessages: many(messages),
  sentMessages: many(messages, { relationName: "messageSender" }),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  user: one(users, {
    fields: [properties.userId],
    references: [users.id],
  }),
  location: one(locations, {
    fields: [properties.city],
    references: [locations.name],
  }),
  favoritedBy: many(favorites),
  messages: many(messages),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [favorites.propertyId],
    references: [properties.id],
  }),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  properties: many(properties),
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Settings model for application configuration
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingsSchema>;

// Footer content model for customizable footer
export const footerContents = pgTable("footer_contents", {
  id: serial("id").primaryKey(),
  section: text("section").notNull(), // e.g., 'quick_links', 'property_types', 'locations', 'social_media', 'languages', etc.
  title: text("title").notNull(),     // Display title for the link or content
  content: text("content").notNull(), // Description or additional text
  link: text("link"),                 // URL or path for the link
  icon: text("icon"),                 // Icon class (e.g., "ri-facebook-fill")
  position: integer("position").notNull(), // For ordering within a section
  active: boolean("active").default(true).notNull(),
  openInNewTab: boolean("open_in_new_tab").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertFooterContentSchema = createInsertSchema(footerContents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type FooterContent = typeof footerContents.$inferSelect;
export type InsertFooterContent = z.infer<typeof insertFooterContentSchema>;

// Page content model for dynamic content on pages like agents, neighborhoods, mortgage, etc.
export const pageContents = pgTable("page_contents", {
  id: serial("id").primaryKey(),
  pageType: text("page_type").notNull(), // e.g., 'agents', 'neighborhoods', 'mortgage'
  section: text("section").notNull(),    // e.g., 'hero', 'features', 'team', 'faq', etc.
  title: text("title"),
  subtitle: text("subtitle"),
  content: text("content"),
  image: text("image"),
  link: text("link"),
  linkText: text("link_text"),
  buttonText: text("button_text"),
  position: integer("position").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertPageContentSchema = createInsertSchema(pageContents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PageContent = typeof pageContents.$inferSelect;
export type InsertPageContent = z.infer<typeof insertPageContentSchema>;

export const PROPERTY_TYPES = [
  { label: "Apartment", value: "apartment" },
  { label: "House", value: "house" },
  { label: "Townhouse", value: "townhouse" },
  { label: "Villa", value: "villa" },
  { label: "Penthouse", value: "penthouse" },
  { label: "Studio", value: "studio" },
  { label: "Commercial", value: "commercial" },
  { label: "Land", value: "land" },
  { label: "Cottage", value: "cottage" },
  { label: "Office", value: "office" },
  // Add any other types here
];

export const neighborhoods = pgTable('neighborhoods', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  description: text('description'),
  image: varchar('image', { length: 512 }), // URL to an image
  averagePrice: decimal('average_price', { precision: 12, scale: 2 }), // Example stat
  populationDensity: integer('population_density'), // Example stat (people per sq km)
  walkScore: integer('walk_score'), // Example stat (0-100)
  transitScore: integer('transit_score'), // Example stat (0-100)
  latitude: decimal('latitude', { precision: 9, scale: 6 }), // For map display
  longitude: decimal('longitude', { precision: 9, scale: 6 }), // For map display
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    nameCityIdx: uniqueIndex('neighborhood_name_city_idx').on(table.name, table.city), // Ensure unique neighborhood per city
  };
});

export type Neighborhood = typeof neighborhoods.$inferSelect;
export type InsertNeighborhood = typeof neighborhoods.$inferInsert;

// Zod schemas for validation
export const insertNeighborhoodSchema = createInsertSchema(neighborhoods, {
  // Make fields required if they aren't optional in the DB but are in the form
  name: z.string().min(2, "Neighborhood name is required"),
  city: z.string().min(2, "City name is required"),
  description: z.string().optional(),
  image: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  // Use coerce for number inputs from forms which might be strings initially
  averagePrice: z.coerce.number().positive("Must be positive").optional(),
  populationDensity: z.coerce.number().int().positive("Must be a positive integer").optional(),
  walkScore: z.coerce.number().int().min(0).max(100).optional(),
  transitScore: z.coerce.number().int().min(0).max(100).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true }); // Omit auto-generated fields

export const updateNeighborhoodSchema = insertNeighborhoodSchema.partial(); // All fields optional for update

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(), // For SEO-friendly URLs
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'set null' }), // Link to users table (optional)
  authorName: varchar('author_name', { length: 100 }), // Store author name directly if not linking
  category: varchar('category', { length: 50 }),
  tags: text('tags'), // Comma-separated tags or use a separate tags table
  imageUrl: varchar('image_url', { length: 512 }),
  readTimeMinutes: integer('read_time_minutes'),
  isPublished: boolean('is_published').default(false).notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(), // Remove .onUpdateNow()
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

// Zod schemas for validation
export const insertPostSchema = createInsertSchema(posts, {
  // Add specific validations
  title: z.string().min(5, "Title must be at least 5 characters"),
  slug: z.string().min(3, "Slug is required").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  authorId: z.coerce.number().int().positive().optional(), // Optional if storing name directly
  authorName: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(), // Could refine validation for comma-separated
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  readTimeMinutes: z.coerce.number().int().positive().optional(),
  isPublished: z.boolean().default(false),
  publishedAt: z.coerce.date().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true }); // Omit auto-generated fields

export const updatePostSchema = insertPostSchema.partial(); // All fields optional for update

// --- Static Pages model for admin-editable HTML pages ---
export const staticPages = pgTable('static_pages', {
  slug: varchar('slug', { length: 100 }).primaryKey(),
  content: text('content'),
});

export type StaticPage = typeof staticPages.$inferSelect;
export type InsertStaticPage = typeof staticPages.$inferInsert;

export const crime_data = pgTable('crime_data', {
    id: serial('id').primaryKey(),
    month: varchar('month', { length: 10 }).notNull(),
    municipality_code: varchar('municipality_code', { length: 10 }).notNull(),
    municipality_name: varchar('municipality_name', { length: 100 }).notNull(),
    crime_group_code: varchar('crime_group_code', { length: 20 }).notNull(),
    crime_group_name: varchar('crime_group_name', { length: 200 }).notNull(),
    crime_count: integer('crime_count').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});