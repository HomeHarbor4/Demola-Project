// server/storage.ts
import {
  users,
  type User,
  type InsertUser,
  properties,
  type Property,
  type InsertProperty,
  locations,
  type Location,
  type InsertLocation,
  favorites,
  type Favorite,
  type InsertFavorite,
  messages,
  type Message,
  type InsertMessage,
  footerContents,
  type FooterContent,
  type InsertFooterContent,
  pageContents,
  type PageContent,
  type InsertPageContent,
} from "@shared/schema";
import { db } from "./db";
// Make sure 'ilike' is imported if you want case-insensitive search
import {
  eq,
  like,
  ilike,
  or,
  and,
  desc,
  gte,
  lte,
  ne,
  inArray,
  count,
  sql,
  asc,
  getTableColumns,
  isNotNull,
  SQL,
} from "drizzle-orm";
import { log } from "console";
import { seedDatabase } from "./seedDatabase";

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Property operations
  getProperties(
    filters?: any
  ): Promise<{ properties: Property[]; total: number }>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(
    id: number,
    property: Partial<Property>
  ): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;
  getPropertiesByUser(userId: number): Promise<Property[]>;
  getFeaturedProperties(limit?: number): Promise<Property[]>;
  searchProperties(query: string): Promise<Property[]>;
  getRecommendedProperties(
    propertyId: number,
    limit?: number
  ): Promise<Property[]>;

  // Location operations
  getLocations(): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(
    id: number,
    location: Partial<Location>
  ): Promise<Location | undefined>;
  deleteLocation(id: number): Promise<boolean>;

  // Favorites operations
  getFavoritesByUser(userId: number): Promise<Property[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, propertyId: number): Promise<boolean>;
  isFavorite(userId: number, propertyId: number): Promise<boolean>;
  getAllFavorites(): Promise<Favorite[]>;

  // Messages operations
  getMessages(filters?: any): Promise<{ messages: Message[]; total: number }>;
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(
    id: number,
    message: Partial<Message>
  ): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<boolean>;
  getMessagesByUser(userId: number): Promise<Message[]>;
  getMessagesByProperty(propertyId: number): Promise<Message[]>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  markMessageAsReplied(id: number): Promise<Message | undefined>;

  // Admin operations (dashboard data aggregation)
  getPropertiesByType(): Promise<Record<string, number>>;
  getPropertiesByListingType(): Promise<Record<string, number>>;
  getPropertiesByCity(): Promise<Record<string, number>>;

  // Footer content operations
  getFooterContents(): Promise<FooterContent[]>;
  getFooterContentsBySection(section: string): Promise<FooterContent[]>;
  getFooterContent(id: number): Promise<FooterContent | undefined>;
  createFooterContent(content: InsertFooterContent): Promise<FooterContent>;
  updateFooterContent(
    id: number,
    content: Partial<InsertFooterContent>
  ): Promise<FooterContent | undefined>;
  deleteFooterContent(id: number): Promise<boolean>;
  reorderFooterContent(id: number, newPosition: number): Promise<boolean>;

  // Page content operations for dynamic pages (agents, neighborhoods, mortgage, etc.)
  getPageContents(pageType?: string): Promise<PageContent[]>;
  getPageContentsByType(pageType: string): Promise<PageContent[]>;
  getPageContentsByTypeAndSection(
    pageType: string,
    section: string
  ): Promise<PageContent[]>;
  getPageContent(id: number): Promise<PageContent | undefined>;
  createPageContent(content: InsertPageContent): Promise<PageContent>;
  updatePageContent(
    id: number,
    content: Partial<InsertPageContent>
  ): Promise<PageContent | undefined>;
  deletePageContent(id: number): Promise<boolean>;
  reorderPageContent(id: number, newPosition: number): Promise<boolean>;

  // Database initialization (optional)
  initializeDatabase(): Promise<void>;
}

// In-memory storage implementation (kept for reference/testing, but DatabaseStorage is primary)
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private locations: Map<number, Location>;
  private favorites: Map<number, Favorite>;
  private messages: Map<number, Message>;
  private footerContents: Map<number, FooterContent>;
  private pageContents: Map<number, PageContent>;
  private userCurrentId: number;
  private propertyCurrentId: number;
  private locationCurrentId: number;
  private favoriteCurrentId: number;
  private messageCurrentId: number;
  private footerContentCurrentId: number;
  private pageContentCurrentId: number;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.locations = new Map();
    this.favorites = new Map();
    this.messages = new Map();
    this.footerContents = new Map();
    this.pageContents = new Map();
    this.userCurrentId = 1;
    this.propertyCurrentId = 1;
    this.locationCurrentId = 1;
    this.favoriteCurrentId = 1;
    this.messageCurrentId = 1;
    this.footerContentCurrentId = 1;
    this.pageContentCurrentId = 1;

    // Initialize with some sample data
    this.initializeSampleData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const createdAt = new Date();
    const user: User = {
      ...insertUser,
      id,
      createdAt,
      role: insertUser.role || "user", // Ensure role has a default
      password: insertUser.password || "placeholder", // Ensure password exists
      phone: insertUser.phone || null, // Ensure phone is null if undefined
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(
    id: number,
    userUpdate: Partial<InsertUser>
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Property methods
  async getProperties(
    filters?: any
  ): Promise<{ properties: Property[]; total: number }> {
    let result = Array.from(this.properties.values());

    if (filters) {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        result = result.filter(
          (p) =>
            p.title.toLowerCase().includes(searchTerm) ||
            p.city.toLowerCase().includes(searchTerm) ||
            p.address.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm)
        );
      }

      // Basic filters
      if (filters.propertyType) {
        const types = Array.isArray(filters.propertyType)
          ? filters.propertyType
          : [filters.propertyType];
        if (types.length > 0) {
          result = result.filter((p) => types.includes(p.propertyType));
        }
      }
      if (filters.listingType)
        result = result.filter((p) => p.listingType === filters.listingType);
      if (filters.city) result = result.filter((p) => p.city === filters.city);
      if (filters.bedrooms)
        result = result.filter((p) => p.bedrooms === Number(filters.bedrooms));
      if (filters.bathrooms)
        result = result.filter(
          (p) => p.bathrooms === Number(filters.bathrooms)
        );
      if (filters.featured !== undefined)
        result = result.filter(
          (p) =>
            p.featured ===
            (filters.featured === "true" || filters.featured === true)
        );
      if (filters.verified !== undefined)
        result = result.filter(
          (p) =>
            p.verified ===
            (filters.verified === "true" || filters.verified === true)
        );
      if (filters.status)
        result = result.filter((p) => p.status === filters.status);

      // Ownership filters
      if (filters.ownership) {
        const ownerships = Array.isArray(filters.ownership)
          ? filters.ownership
          : [filters.ownership];
        if (ownerships.length > 0) {
          result = result.filter(
            (p) =>
              p.propertyOwnership && ownerships.includes(p.propertyOwnership)
          );
        }
      }

      // Posted by filters
      if (filters.postedBy) {
        const roles = Array.isArray(filters.postedBy)
          ? filters.postedBy
          : [filters.postedBy];
        if (roles.length > 0) {
          const userIds = new Set<number>();
          this.users.forEach((user, id) => {
            if (roles.includes(user.role)) userIds.add(id);
          });
          result = result.filter((p) => userIds.has(p.userId));
        }
      }

      // Media filters
      if (filters.onlyWithPhotos === "true" || filters.onlyWithPhotos === true)
        result = result.filter((p) => p.images && p.images.length > 0);
      if (filters.onlyWithVideos === "true" || filters.onlyWithVideos === true)
        result = result.filter(
          (p) => p.images && p.images.some((url) => url.includes("video"))
        ); // Simple check

      // Price range filters
      if (filters.minPrice !== undefined) {
        const min = parseFloat(filters.minPrice);
        if (!isNaN(min)) result = result.filter((p) => p.price >= min);
      }
      if (filters.maxPrice !== undefined) {
        const max = parseFloat(filters.maxPrice);
        if (!isNaN(max)) result = result.filter((p) => p.price <= max);
      }

      // Area range filters
      if (filters.minArea !== undefined) {
        const min = parseFloat(filters.minArea);
        if (!isNaN(min)) result = result.filter((p) => p.area >= min);
      }
      if (filters.maxArea !== undefined) {
        const max = parseFloat(filters.maxArea);
        if (!isNaN(max)) result = result.filter((p) => p.area <= max);
      }

      // Amenities filter
      if (
        filters.amenities &&
        Array.isArray(filters.amenities) &&
        filters.amenities.length > 0
      ) {
        result = result.filter(
          (p) =>
            p.features &&
            filters.amenities.every((amenity: string) =>
              p.features!.includes(amenity)
            )
        );
      }

      // Geolocation filter
      if (filters.coordinates) {
        const { lat, lng, radius } = filters.coordinates;
        if (lat !== undefined && lng !== undefined && radius !== undefined) {
          result = result.filter((p) => {
            if (!p.latitude || !p.longitude) return false;
            const distance = this.calculateDistance(
              lat,
              lng,
              p.latitude,
              p.longitude
            );
            return distance <= radius * 1000; // radius in km
          });
        }
      }
    }

    const totalCount = result.length;

    // Apply pagination
    const page = filters?.page ? parseInt(String(filters.page), 10) : 1;
    const limit = filters?.limit ? parseInt(String(filters.limit), 10) : 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    result = result.slice(startIndex, endIndex);

    return { properties: result, total: totalCount };
  }

  // Haversine formula
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c) / 1000; // distance in km
  }

  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = this.propertyCurrentId++;
    const createdAt = new Date();
    const property: Property = {
      ...insertProperty,
      id,
      createdAt,
      featured: false,
      verified: false,
      status: "active",
      postalCode: insertProperty.postalCode || null,
      features: insertProperty.features || [],
      images: insertProperty.images || [],
      latitude: insertProperty.latitude || null,
      longitude: insertProperty.longitude || null,
      transactionType: insertProperty.transactionType || "new",
      propertyOwnership: insertProperty.propertyOwnership || "freehold",
      flooringDetails: insertProperty.flooringDetails || null,
      furnishingDetails: insertProperty.furnishingDetails || null,
      heatingAvailable: insertProperty.heatingAvailable || false,
      waterDetails: insertProperty.waterDetails || null,
      gasDetails: insertProperty.gasDetails || null,
      ownerDetails: insertProperty.ownerDetails || null,
      averageNearbyPrices: insertProperty.averageNearbyPrices || null,
      registrationDetails: insertProperty.registrationDetails || null,
    };
    this.properties.set(id, property);
    return property;
  }

  async updateProperty(
    id: number,
    propertyUpdate: Partial<Property>
  ): Promise<Property | undefined> {
    const property = this.properties.get(id);
    if (!property) return undefined;
    const updatedProperty = { ...property, ...propertyUpdate };
    this.properties.set(id, updatedProperty);
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<boolean> {
    return this.properties.delete(id);
  }

  async getPropertiesByUser(userId: number): Promise<Property[]> {
    return Array.from(this.properties.values()).filter(
      (p) => p.userId === userId
    );
  }

  async getFeaturedProperties(limit: number = 10): Promise<Property[]> {
    return Array.from(this.properties.values())
      .filter((p) => p.featured)
      .slice(0, limit);
  }

  async searchProperties(query: string): Promise<Property[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.properties.values()).filter(
      (p) =>
        p.title.toLowerCase().includes(lowercaseQuery) ||
        p.description.toLowerCase().includes(lowercaseQuery) ||
        p.address.toLowerCase().includes(lowercaseQuery) ||
        p.city.toLowerCase().includes(lowercaseQuery)
    );
  }

  async getRecommendedProperties(
    propertyId: number,
    limit: number = 5
  ): Promise<Property[]> {
    const sourceProperty = this.properties.get(propertyId);
    if (!sourceProperty) return [];
    const allProperties = Array.from(this.properties.values()).filter(
      (p) => p.id !== propertyId
    );
    const propertiesWithScores = allProperties.map((property) => ({
      property,
      score: this.calculateSimilarityScore(sourceProperty, property),
    }));
    return propertiesWithScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.property);
  }

  private calculateSimilarityScore(source: Property, target: Property): number {
    let score = 0;
    if (
      source.latitude &&
      source.longitude &&
      target.latitude &&
      target.longitude
    ) {
      const distance = this.calculateDistance(
        source.latitude,
        source.longitude,
        target.latitude,
        target.longitude
      );
      if (distance < 5) score += 30;
      else if (distance < 10) score += 20;
      else if (distance < 15) score += 10;
    }
    if (source.propertyType === target.propertyType) score += 15;
    if (source.listingType === target.listingType) score += 15;
    if (Math.abs(source.price - target.price) <= source.price * 0.2)
      score += 15;
    if (Math.abs(source.area - target.area) <= source.area * 0.2) score += 10;
    if (source.bedrooms === target.bedrooms) score += 10;
    else if (Math.abs(source.bedrooms - target.bedrooms) === 1) score += 5;
    if (source.bathrooms === target.bathrooms) score += 5;
    else if (Math.abs(source.bathrooms - target.bathrooms) === 1) score += 2;
    if (source.features && target.features) {
      const commonFeatures = source.features.filter((f) =>
        target.features!.includes(f)
      );
      score += Math.min(commonFeatures.length * 2, 10);
    }
    return score;
  }

  // Location methods
  async getLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }
  async getLocation(id: number): Promise<Location | undefined> {
    return this.locations.get(id);
  }
  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = this.locationCurrentId++;
    const location: Location = {
      ...insertLocation,
      id,
      country: insertLocation.country || "Unknown", // Add default if needed
      image: insertLocation.image || "", // Add default if needed
      description: insertLocation.description || null,
      latitude: insertLocation.latitude || null,
      longitude: insertLocation.longitude || null,
      propertyCount: insertLocation.propertyCount || 0,
    };
    this.locations.set(id, location);
    return location;
  }
  async updateLocation(
    id: number,
    locationUpdate: Partial<Location>
  ): Promise<Location | undefined> {
    const location = this.locations.get(id);
    if (!location) return undefined;
    const updatedLocation = { ...location, ...locationUpdate };
    this.locations.set(id, updatedLocation);
    return updatedLocation;
  }
  async deleteLocation(id: number): Promise<boolean> {
    return this.locations.delete(id);
  }

  // Favorites methods
  async getFavoritesByUser(userId: number): Promise<Property[]> {
    const favs = Array.from(this.favorites.values()).filter(
      (f) => f.userId === userId
    );
    return favs
      .map((f) => this.properties.get(f.propertyId))
      .filter((p) => p !== undefined) as Property[];
  }
  async addFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const id = this.favoriteCurrentId++;
    const createdAt = new Date();
    const favorite: Favorite = { ...insertFavorite, id, createdAt };
    this.favorites.set(id, favorite);
    return favorite;
  }
  async removeFavorite(userId: number, propertyId: number): Promise<boolean> {
    const fav = Array.from(this.favorites.values()).find(
      (f) => f.userId === userId && f.propertyId === propertyId
    );
    return fav ? this.favorites.delete(fav.id) : false;
  }
  async isFavorite(userId: number, propertyId: number): Promise<boolean> {
    return Array.from(this.favorites.values()).some(
      (f) => f.userId === userId && f.propertyId === propertyId
    );
  }
  async getAllFavorites(): Promise<Favorite[]> {
    return Array.from(this.favorites.values());
  }

  // Message methods
  async getMessages(
    filters?: any
  ): Promise<{ messages: Message[]; total: number }> {
    let result = Array.from(this.messages.values());
    if (filters) {
      if (filters.status)
        result = result.filter((m) => m.status === filters.status);
      if (filters.propertyId)
        result = result.filter(
          (m) => m.propertyId === Number(filters.propertyId)
        );
      if (filters.userId)
        result = result.filter((m) => m.userId === Number(filters.userId));
      if (filters.search) {
        const search = filters.search.toLowerCase();
        result = result.filter(
          (m) =>
            m.subject.toLowerCase().includes(search) ||
            m.message.toLowerCase().includes(search)
        );
      }
    }
    const total = result.length;
    const page = filters?.page ? parseInt(String(filters.page), 10) : 1;
    const limit = filters?.limit ? parseInt(String(filters.limit), 10) : 10;
    const startIndex = (page - 1) * limit;
    result = result.slice(startIndex, startIndex + limit);
    return {
      messages: result.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      ),
      total,
    };
  }
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageCurrentId++;
    const createdAt = new Date();
    const message: Message = {
      ...insertMessage,
      id,
      createdAt,
      status: "unread", // Default status
      propertyId: insertMessage.propertyId || null,
      userId: insertMessage.userId || null,
      senderUserId: insertMessage.senderUserId || null,
    };
    this.messages.set(id, message);
    return message;
  }
  async updateMessage(
    id: number,
    messageUpdate: Partial<Message>
  ): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    const updatedMessage = { ...message, ...messageUpdate };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
  async deleteMessage(id: number): Promise<boolean> {
    return this.messages.delete(id);
  }
  async getMessagesByUser(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((m) => m.userId === userId || m.senderUserId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async getMessagesByProperty(propertyId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((m) => m.propertyId === propertyId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async markMessageAsRead(id: number): Promise<Message | undefined> {
    return this.updateMessage(id, { status: "read" });
  }
  async markMessageAsReplied(id: number): Promise<Message | undefined> {
    return this.updateMessage(id, { status: "replied" });
  }

  // Admin aggregation methods
  async getPropertiesByType(): Promise<Record<string, number>> {
    const result: Record<string, number> = {};
    this.properties.forEach((p) => {
      result[p.propertyType] = (result[p.propertyType] || 0) + 1;
    });
    return result;
  }
  async getPropertiesByListingType(): Promise<Record<string, number>> {
    const result: Record<string, number> = {};
    this.properties.forEach((p) => {
      result[p.listingType] = (result[p.listingType] || 0) + 1;
    });
    return result;
  }
  async getPropertiesByCity(): Promise<Record<string, number>> {
    const result: Record<string, number> = {};
    this.properties.forEach((p) => {
      result[p.city] = (result[p.city] || 0) + 1;
    });
    return result;
  }

  // Footer Content methods
  async getFooterContents(): Promise<FooterContent[]> {
    return Array.from(this.footerContents.values()).sort(
      (a, b) => a.position - b.position
    );
  }
  async getFooterContentsBySection(section: string): Promise<FooterContent[]> {
    return Array.from(this.footerContents.values())
      .filter((c) => c.section === section)
      .sort((a, b) => a.position - b.position);
  }
  async getFooterContent(id: number): Promise<FooterContent | undefined> {
    return this.footerContents.get(id);
  }
  async createFooterContent(
    content: InsertFooterContent
  ): Promise<FooterContent> {
    const id = this.footerContentCurrentId++;
    const createdAt = new Date();
    const newContent: FooterContent = {
      ...content,
      id,
      createdAt,
      updatedAt: null,
      content: content.content || "", // Ensure content is string
      link: content.link || null,
      icon: content.icon || null,
      active: content.active !== undefined ? content.active : true,
      openInNewTab:
        content.openInNewTab !== undefined ? content.openInNewTab : false,
    };
    this.footerContents.set(id, newContent);
    return newContent;
  }
  async updateFooterContent(
    id: number,
    content: Partial<InsertFooterContent>
  ): Promise<FooterContent | undefined> {
    const existing = this.footerContents.get(id);
    if (!existing) return undefined;
    const updatedContent = { ...existing, ...content, updatedAt: new Date() };
    this.footerContents.set(id, updatedContent);
    return updatedContent;
  }
  async deleteFooterContent(id: number): Promise<boolean> {
    return this.footerContents.delete(id);
  }
  async reorderFooterContent(
    id: number,
    newPosition: number
  ): Promise<boolean> {
    const item = this.footerContents.get(id);
    if (!item) return false;
    const itemsInSection = Array.from(this.footerContents.values())
      .filter((c) => c.section === item.section)
      .sort((a, b) => a.position - b.position);
    const currentIndex = itemsInSection.findIndex((c) => c.id === id);
    if (currentIndex === -1) return false;
    itemsInSection.splice(currentIndex, 1);
    itemsInSection.splice(newPosition, 0, item);
    itemsInSection.forEach((c, index) => {
      if (c.position !== index)
        this.updateFooterContent(c.id, { position: index });
    });
    return true;
  }

  // Page Content methods
  async getPageContents(pageType?: string): Promise<PageContent[]> {
    let result = Array.from(this.pageContents.values());
    if (pageType) result = result.filter((c) => c.pageType === pageType);
    return result.sort((a, b) => a.position - b.position);
  }
  async getPageContentsByType(pageType: string): Promise<PageContent[]> {
    return this.getPageContents(pageType);
  }
  async getPageContentsByTypeAndSection(
    pageType: string,
    section: string
  ): Promise<PageContent[]> {
    return Array.from(this.pageContents.values())
      .filter((c) => c.pageType === pageType && c.section === section)
      .sort((a, b) => a.position - b.position);
  }
  async getPageContent(id: number): Promise<PageContent | undefined> {
    return this.pageContents.get(id);
  }
  async createPageContent(content: InsertPageContent): Promise<PageContent> {
    const id = this.pageContentCurrentId++;
    const createdAt = new Date();
    const newContent: PageContent = {
      ...content,
      id,
      createdAt,
      updatedAt: null,
      title: content.title || null,
      subtitle: content.subtitle || null,
      content: content.content || null,
      image: content.image || null,
      link: content.link || null,
      linkText: content.linkText || null,
      buttonText: content.buttonText || null,
      active: content.active !== undefined ? content.active : true,
    };
    this.pageContents.set(id, newContent);
    return newContent;
  }
  async updatePageContent(
    id: number,
    content: Partial<InsertPageContent>
  ): Promise<PageContent | undefined> {
    const existing = this.pageContents.get(id);
    if (!existing) return undefined;
    const updatedContent = { ...existing, ...content, updatedAt: new Date() };
    this.pageContents.set(id, updatedContent);
    return updatedContent;
  }
  async deletePageContent(id: number): Promise<boolean> {
    return this.pageContents.delete(id);
  }
  async reorderPageContent(id: number, newPosition: number): Promise<boolean> {
    const item = this.pageContents.get(id);
    if (!item) return false;
    const itemsInSection = Array.from(this.pageContents.values())
      .filter((c) => c.pageType === item.pageType && c.section === item.section)
      .sort((a, b) => a.position - b.position);
    const currentIndex = itemsInSection.findIndex((c) => c.id === id);
    if (currentIndex === -1) return false;
    itemsInSection.splice(currentIndex, 1);
    itemsInSection.splice(newPosition, 0, item);
    itemsInSection.forEach((c, index) => {
      if (c.position !== index)
        this.updatePageContent(c.id, { position: index });
    });
    return true;
  }

  // Initialize sample data (simplified)
  private initializeSampleData() {
    this.createUser({
      username: "demouser",
      password: "password123",
      email: "demo@example.com",
      name: "Demo User",
      role: "user",
    });
    this.createUser({
      username: "agent",
      password: "agent123",
      email: "agent@example.com",
      name: "Jane Agent",
      role: "agent",
    });
    this.createUser({
      username: "admin",
      password: "admin123",
      email: "admin@example.com",
      name: "Admin User",
      role: "admin",
    });
    // Add more sample data if needed
  }

  // Database initialization (not applicable for MemStorage)
  async initializeDatabase(): Promise<void> {
    log("MemStorage initialized with sample data.");
    return Promise.resolve();
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const userToInsert = { ...insertUser, role: insertUser.role || "user" };
    const [user] = await db.insert(users).values(userToInsert).returning();
    return user;
  }

  async updateUser(
    id: number,
    userUpdate: Partial<InsertUser>
  ): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userUpdate)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });
    return result.length > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Property operations
  async getProperties(
    filters?: any
  ): Promise<{ properties: Property[]; total: number }> {
    // Base queries for selecting properties and counting them
    // We might need to join with users later based on filters
    let query = db
      .select({
        // Select specific columns to avoid fetching everything if joining
        property: properties,
        // Optionally include user data if needed directly, but getProperty handles this better for single items
        // user: { id: users.id, name: users.name, role: users.role }
      })
      .from(properties);

    let countQuery = db
      .select({ count: sql<number>`count(distinct ${properties.id})` }) // Count distinct properties
      .from(properties);

    const conditions: SQL[] = []; // Use SQL[] type for conditions
    let needsUserJoin = false; // Flag to track if user join is needed

    log("Applying filters:", filters); // Log received filters

    if (filters) {
      // --- Search Filter ---
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        conditions.push(
          or(
            ilike(properties.title, searchTerm),
            ilike(properties.city, searchTerm),
            ilike(properties.address, searchTerm), // Added address search
            ilike(properties.description, searchTerm) // Added description search
          )! // Add '!' to assert that the result is not null/undefined if needed
        );
      }

      // --- Basic Filters ---
      if (filters.propertyType) {
        const types = Array.isArray(filters.propertyType)
          ? filters.propertyType
          : [filters.propertyType];
        if (types.length > 0)
          conditions.push(inArray(properties.propertyType, types));
      }
      if (filters.listingType)
        conditions.push(eq(properties.listingType, filters.listingType));
      if (filters.city) conditions.push(eq(properties.city, filters.city));
      if (filters.bedrooms !== undefined) {
        const beds = Number(filters.bedrooms);
        if (!isNaN(beds)) conditions.push(eq(properties.bedrooms, beds));
      }
      if (filters.bathrooms !== undefined) {
        const baths = Number(filters.bathrooms);
        if (!isNaN(baths)) conditions.push(eq(properties.bathrooms, baths));
      }
      if (filters.featured !== undefined)
        conditions.push(
          eq(
            properties.featured,
            filters.featured === "true" || filters.featured === true
          )
        );
      if (filters.verified !== undefined)
        conditions.push(
          eq(
            properties.verified,
            filters.verified === "true" || filters.verified === true
          )
        );
      if (filters.status)
        conditions.push(eq(properties.status, filters.status));
      if (filters.transactionType)
        conditions.push(
          eq(properties.transactionType, filters.transactionType)
        );

      // --- Price Range ---
      if (filters.minPrice !== undefined) {
        const min = parseFloat(filters.minPrice);
        if (!isNaN(min)) conditions.push(gte(properties.price, min));
      }
      if (filters.maxPrice !== undefined) {
        const max = parseFloat(filters.maxPrice);
        if (!isNaN(max)) conditions.push(lte(properties.price, max));
      }

      // --- Area Range ---
      if (filters.minArea !== undefined) {
        const min = parseFloat(filters.minArea);
        if (!isNaN(min)) conditions.push(gte(properties.area, min));
      }
      if (filters.maxArea !== undefined) {
        const max = parseFloat(filters.maxArea);
        if (!isNaN(max)) conditions.push(lte(properties.area, max));
      }

      // --- Ownership Filter ---
      if (filters.ownership) {
        const ownerships = Array.isArray(filters.ownership)
          ? filters.ownership
          : [filters.ownership];
        if (ownerships.length > 0)
          conditions.push(inArray(properties.propertyOwnership, ownerships));
      }

      // --- Furnishing Filter ---
      if (filters.furnishingDetails) {
        const furnishings = Array.isArray(filters.furnishingDetails)
          ? filters.furnishingDetails
          : [filters.furnishingDetails];
        if (furnishings.length > 0)
          conditions.push(inArray(properties.furnishingDetails, furnishings));
      }

      // --- Heating Filter ---
      if (filters.heatingAvailable !== undefined)
        conditions.push(
          eq(
            properties.heatingAvailable,
            filters.heatingAvailable === "true" ||
              filters.heatingAvailable === true
          )
        );

      // --- Amenities Filter ---
      if (
        filters.amenities &&
        Array.isArray(filters.amenities) &&
        filters.amenities.length > 0
      ) {
        // Assumes 'features' is text[]. Use appropriate syntax for jsonb if needed.
        // Ensure amenities are properly escaped for the SQL query
        const escapedAmenities = filters.amenities
          .map((a: string) => `'${a.replace(/'/g, "''")}'`)
          .join(",");
        conditions.push(
          sql`${properties.features} @> ARRAY[${sql.raw(
            escapedAmenities
          )}]::text[]`
        );
      }

      // --- Media Filters ---
      if (
        filters.onlyWithPhotos === "true" ||
        filters.onlyWithPhotos === true
      ) {
        // Check if images array is not null AND has elements
        // Assumes 'images' is text[]
        conditions.push(
          and(
            isNotNull(properties.images),
            sql`cardinality(${properties.images}) > 0`
          )!
        );
      }
      // Note: Filtering by video presence is unreliable without a dedicated field or complex URL checks.
      // if (filters.onlyWithVideos === 'true' || filters.onlyWithVideos === true) {
      //   // Placeholder: Add logic here if you have a way to identify videos
      //   // e.g., conditions.push(sql`${properties.images} @> ARRAY['%video_indicator%']::text[]`); // Example if using a marker
      // }

      // --- Posted By Filter (User Role) ---
      if (filters.postedBy) {
        const roles = Array.isArray(filters.postedBy)
          ? filters.postedBy
          : [filters.postedBy];
        if (roles.length > 0) {
          needsUserJoin = true; // Mark that we need to join with the users table
          conditions.push(inArray(users.role, roles));
        }
      }
    } // End if(filters)

    // --- Apply Joins if Needed ---
    if (needsUserJoin) {
      query = query.innerJoin(users, eq(properties.userId, users.id));
      countQuery = countQuery.innerJoin(users, eq(properties.userId, users.id));
    }

    // --- Apply Conditions ---
    if (conditions.length > 0) {
      const combinedCondition = and(...conditions);
      // Apply where clause to both queries
      // Need to handle potential type issues if query/countQuery structure changes
      query = query.where(combinedCondition);
      countQuery = countQuery.where(combinedCondition);
    }

    // --- Get Total Count (before pagination) ---
    const [countResult] = await countQuery;
    const total = Number(countResult?.count) || 0;

    // --- Apply Sorting ---
    // Default sort: createdAt descending. Add more options based on filters if needed.
    let orderBy: SQL[] = [desc(properties.createdAt)];
    if (filters?.sortBy) {
      const direction = filters.sortDir === "asc" ? asc : desc;
      switch (filters.sortBy) {
        case "price":
          orderBy = [direction(properties.price)];
          break;
        case "area":
          orderBy = [direction(properties.area)];
          break;
        case "date": // Already default
        default:
          orderBy = [desc(properties.createdAt)];
          break;
      }
    }
    query = query.orderBy(...orderBy);

    // --- Apply Pagination ---
    const page = filters?.page ? parseInt(filters.page as string, 10) : 1;
    const limit = filters?.limit ? parseInt(filters.limit as string, 10) : 10;
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset);

    // --- Execute the Main Query ---
    const results = await query;

    // Extract the property data, handling potential joins
    let propertyList = results.map((r) => r.property);

    // --- Geolocation Filtering (Post-Query) ---
    // This runs *after* the database query and pagination.
    // For large datasets, DB-level filtering using PostGIS is much more efficient.
    if (filters?.coordinates) {
      const { lat, lng, radius } = filters.coordinates;
      // Ensure lat, lng, and radius are valid numbers
      const numLat = parseFloat(lat);
      const numLng = parseFloat(lng);
      const numRadius = parseFloat(radius);

      if (
        !isNaN(numLat) &&
        !isNaN(numLng) &&
        !isNaN(numRadius) &&
        numRadius > 0
      ) {
        log(
          `Applying post-query geo-filter: lat=${numLat}, lng=${numLng}, radius=${numRadius}km`
        );
        propertyList = propertyList.filter((p) => {
          if (p.latitude == null || p.longitude == null) return false; // Use == null to check for null or undefined
          const distance = this.calculateDistance(
            numLat,
            numLng,
            p.latitude,
            p.longitude
          );
          return distance <= numRadius; // Assuming radius is in km
        });
        // IMPORTANT: The 'total' count returned will NOT reflect this post-query filtering.
        // The total count represents matches *before* geo-filtering.
        // Accurate total counts with geo-filtering require PostGIS functions in the countQuery.
        log(`Properties after geo-filter: ${propertyList.length}`);
      } else {
        log("Invalid coordinates or radius provided for geo-filtering.");
      }
    }

    return { properties: propertyList, total: total };
  }

  // Haversine formula
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  async getProperty(id: number): Promise<any | undefined> {
    // Use db.query for relational fetching
    const propertyData = await db.query.properties.findFirst({
      where: eq(properties.id, id),
      with: {
        // Include the related 'user' based on the relation defined in schema.ts
        user: {
          columns: {
            // Select only the necessary columns from the user table
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        // Include the related location to get municipality code
        location: {
          columns: {
            municipalityCode: true,
          },
        },
      },
    });

    if (!propertyData) {
      return undefined;
    }

    // Transform the data to include owner details and municipality code
    return {
      ...propertyData,
      ownerDetails: {
        name: propertyData.user?.name || '',
        email: propertyData.user?.email || '',
        phone: propertyData.user?.phone || '',
        userId: propertyData.user?.id || 0,
      },
      municipalityCode: propertyData.location?.municipalityCode || null,
    };
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await db
      .insert(properties)
      .values({
        ...insertProperty,
        featured: false, // Ensure defaults are set if not in schema/payload
        verified: false,
        status: insertProperty.status || "active",
      })
      .returning();
    return property;
  }

  async updateProperty(
    id: number,
    propertyUpdate: Partial<Property>
  ): Promise<Property | undefined> {
    const [property] = await db
      .update(properties)
      .set(propertyUpdate)
      .where(eq(properties.id, id))
      .returning();
    return property;
  }

  async deleteProperty(id: number): Promise<boolean> {
    const result = await db
      .delete(properties)
      .where(eq(properties.id, id))
      .returning({ id: properties.id });
    return result.length > 0;
  }

  async getPropertiesByUser(userId: number): Promise<Property[]> {
    return await db
      .select()
      .from(properties)
      .where(eq(properties.userId, userId))
      .orderBy(desc(properties.createdAt));
  }

  async getFeaturedProperties(limit: number = 16): Promise<Property[]> {
    return await db
      .select()
      .from(properties)
      .where(eq(properties.featured, true))
      .orderBy(desc(properties.createdAt))
      .limit(limit);
    // Note: Removed the logic to supplement with non-featured as it complicates things.
    // The frontend can fetch more if needed.
  }

  async searchProperties(query: string): Promise<Property[]> {
    const searchTerm = `%${query}%`;
    return await db
      .select()
      .from(properties)
      .where(
        or(
          ilike(properties.title, searchTerm),
          ilike(properties.description, searchTerm),
          ilike(properties.address, searchTerm),
          ilike(properties.city, searchTerm)
        )
      )
      .orderBy(desc(properties.createdAt));
  }

  async getRecommendedProperties(
    propertyId: number,
    limit: number = 5
  ): Promise<Property[]> {
    const [sourceProperty] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId));
    if (!sourceProperty) return [];

    // Simplified recommendation: properties in the same city, different ID, ordered by creation date
    // A real recommendation engine would be much more complex (similarity scores, user history etc.)
    return await db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.city, sourceProperty.city),
          ne(properties.id, propertyId) // Exclude the source property itself
        )
      )
      .orderBy(desc(properties.createdAt))
      .limit(limit);
  }

  // Location operations
  async getLocations(): Promise<Location[]> { // Renamed for clarity
    // 1. Define the subquery for counting properties per city
    const propertyCountsSubquery = db.select({
        city: properties.city,
        count: sql<number>`count(${properties.id})`.mapWith(Number).as('p_count')
      })
      .from(properties)
      .groupBy(properties.city)
      .as('property_counts'); // Alias the subquery result

    // 2. Select from locations and LEFT JOIN the aliased subquery directly
    const locationsWithCounts = await db
      .select({
        // Select all columns from the original locations table
        ...getTableColumns(locations),
        // Select the count from the subquery, using coalesce for 0 count
        propertyCount: sql<number>`coalesce(${propertyCountsSubquery.count}, 0)`.mapWith(Number)
      })
      .from(locations)
      .leftJoin(
        propertyCountsSubquery,
        // Join condition: location name matches the city from the property counts subquery
        eq(locations.city, propertyCountsSubquery.city)
      )
      .orderBy(desc(sql`coalesce(${propertyCountsSubquery.count}, 0)`), locations.city); // Order by the derived count

    return locationsWithCounts;
  }

  // You should apply the same correction to the getLocation method if it also fetches counts
  async getLocation(id: number): Promise<Location | undefined> {

    const propertyCountsSubquery = db.$with('property_counts').as(
      db.select({
          city: properties.city, // Use 'city'
          count: sql<number>`count(${properties.id})`.mapWith(Number).as('p_count')
      })
      .from(properties)
      .groupBy(properties.city)
    );

    const [location] = await db.with(propertyCountsSubquery)
      .select({
         ...getTableColumns(locations),
         propertyCount: sql<number>`coalesce(${propertyCountsSubquery.count}, 0)`.mapWith(Number)
      })
      .from(locations)
      .leftJoin(
        propertyCountsSubquery,
        eq(locations.name, propertyCountsSubquery.city) // Corrected join condition
      )
      .where(eq(locations.id, id)); // Filter by the requested ID

    return location;
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    // Creating a location doesn't inherently know the property count yet,
    // so we might return it with count 0 or fetch it separately if needed immediately.
    // The schema default should handle propertyCount if not provided here.
    const [location] = await db
      .insert(locations)
      .values(insertLocation)
      .returning();
    // Return the created location, potentially without the accurate count initially
    // Or perform another query like in getLocations/getLocation if count is critical on create
    return { ...location, propertyCount: 0 }; // Assuming count starts at 0
  }

  async updateLocation(
    id: number,
    locationUpdate: Partial<Location>
  ): Promise<Location | undefined> {
    // Updating might change name/city, but propertyCount is derived, so we don't set it here.
    // We fetch the updated location and then potentially fetch its count like in getLocation.
    const [updatedLocationData] = await db
      .update(locations)
      .set(locationUpdate)
      .where(eq(locations.id, id))
      .returning();
    if (!updatedLocationData) return undefined;

    // Fetch the count separately after update
    const [countResult] = await db
      .select({ value: count() })
      .from(properties)
      .where(eq(properties.city, updatedLocationData.name)); // Use updated name/city

    return { ...updatedLocationData, propertyCount: countResult?.value || 0 };
  }

  async deleteLocation(id: number): Promise<boolean> {
    // Consider adding a check if properties exist for this location before deleting
    // You might want to prevent deletion or handle associated properties first.
    // Example check (optional):
    // const [propCount] = await db.select({ value: count() }).from(properties)
    //    .innerJoin(locations, eq(properties.city, locations.name))
    //    .where(eq(locations.id, id));
    // if (propCount?.value > 0) {
    //    throw new Error("Cannot delete location with associated properties.");
    // }

    const result = await db
      .delete(locations)
      .where(eq(locations.id, id))
      .returning({ id: locations.id });
    return result.length > 0;
  }

  // Favorites methods
  async getFavoritesByUser(userId: number): Promise<Property[]> {
    const favoriteProperties = await db
      .select({ property: properties })
      .from(favorites)
      .innerJoin(properties, eq(favorites.propertyId, properties.id))
      .where(eq(favorites.userId, userId));
    return favoriteProperties.map((result) => result.property);
  }

  async addFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const [favorite] = await db
      .insert(favorites)
      .values(insertFavorite)
      .returning();
    return favorite;
  }

  async removeFavorite(userId: number, propertyId: number): Promise<boolean> {
    const result = await db
      .delete(favorites)
      .where(
        and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId))
      )
      .returning({ id: favorites.id });
    return result.length > 0;
  }

  async isFavorite(userId: number, propertyId: number): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(
        and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId))
      )
      .limit(1);
    return !!favorite;
  }

  async getAllFavorites(): Promise<Favorite[]> {
    return await db.select().from(favorites);
  }

  // Message operations
  async getMessages(
    filters?: any
  ): Promise<{ messages: Message[]; total: number }> {
    let query = db.select().from(messages);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(messages);

    const conditions = [];
    if (filters) {
      if (filters.status) conditions.push(eq(messages.status, filters.status));
      if (filters.propertyId)
        conditions.push(eq(messages.propertyId, Number(filters.propertyId)));
      if (filters.userId)
        conditions.push(eq(messages.userId, Number(filters.userId)));
      if (filters.search) {
        const search = `%${filters.search}%`;
        conditions.push(
          or(
            ilike(messages.subject, search),
            ilike(messages.message, search),
            ilike(messages.name, search),
            ilike(messages.email, search)
          )
        );
      }
    }

    if (conditions.length > 0) {
      const combinedCondition = and(...conditions);
      query = query.where(combinedCondition);
      countQuery = countQuery.where(combinedCondition);
    }

    const [countResult] = await countQuery;
    const total = Number(countResult?.count) || 0;

    query = query.orderBy(desc(messages.createdAt));

    const page = filters?.page ? parseInt(filters.page as string, 10) : 1;
    const limit = filters?.limit ? parseInt(filters.limit as string, 10) : 10;
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset);

    const messagesResult = await query;
    return { messages: messagesResult, total: total };
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
    return message;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        ...insertMessage,
        status: "unread", // Ensure default status
      })
      .returning();
    return message;
  }

  async updateMessage(
    id: number,
    messageUpdate: Partial<Message>
  ): Promise<Message | undefined> {
    const [message] = await db
      .update(messages)
      .set(messageUpdate)
      .where(eq(messages.id, id))
      .returning();
    return message;
  }

  async deleteMessage(id: number): Promise<boolean> {
    const result = await db
      .delete(messages)
      .where(eq(messages.id, id))
      .returning({ id: messages.id });
    return result.length > 0;
  }

  async getMessagesByUser(userId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(or(eq(messages.userId, userId), eq(messages.senderUserId, userId)))
      .orderBy(desc(messages.createdAt));
  }

  async getMessagesByProperty(propertyId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.propertyId, propertyId))
      .orderBy(desc(messages.createdAt));
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    return this.updateMessage(id, { status: "read" });
  }

  async markMessageAsReplied(id: number): Promise<Message | undefined> {
    return this.updateMessage(id, { status: "replied" });
  }

  // Admin aggregation methods
  async getPropertiesByType(): Promise<Record<string, number>> {
    const result = await db
      .select({ type: properties.propertyType, count: count() })
      .from(properties)
      .groupBy(properties.propertyType);
    return result.reduce((acc, { type, count }) => {
      acc[type] = count;
      return acc;
    }, {} as Record<string, number>);
  }

  async getPropertiesByListingType(): Promise<Record<string, number>> {
    const result = await db
      .select({ type: properties.listingType, count: count() })
      .from(properties)
      .groupBy(properties.listingType);
    return result.reduce((acc, { type, count }) => {
      acc[type] = count;
      return acc;
    }, {} as Record<string, number>);
  }

  async getPropertiesByCity(): Promise<Record<string, number>> {
    const result = await db
      .select({ city: properties.city, count: count() })
      .from(properties)
      .groupBy(properties.city);
    return result.reduce((acc, { city, count }) => {
      acc[city] = count;
      return acc;
    }, {} as Record<string, number>);
  }

  // Footer content operations
  async getFooterContents(): Promise<FooterContent[]> {
    return await db
      .select()
      .from(footerContents)
      .orderBy(footerContents.section, footerContents.position);
  }
  async getFooterContentsBySection(section: string): Promise<FooterContent[]> {
    return await db
      .select()
      .from(footerContents)
      .where(eq(footerContents.section, section))
      .orderBy(footerContents.position);
  }
  async getFooterContent(id: number): Promise<FooterContent | undefined> {
    const [content] = await db
      .select()
      .from(footerContents)
      .where(eq(footerContents.id, id));
    return content;
  }
  async createFooterContent(
    content: InsertFooterContent
  ): Promise<FooterContent> {
    const [newContent] = await db
      .insert(footerContents)
      .values(content)
      .returning();
    return newContent;
  }
  async updateFooterContent(
    id: number,
    content: Partial<InsertFooterContent>
  ): Promise<FooterContent | undefined> {
    const [updatedContent] = await db
      .update(footerContents)
      .set({ ...content, updatedAt: new Date() })
      .where(eq(footerContents.id, id))
      .returning();
    return updatedContent;
  }
  async deleteFooterContent(id: number): Promise<boolean> {
    const result = await db
      .delete(footerContents)
      .where(eq(footerContents.id, id))
      .returning({ id: footerContents.id });
    return result.length > 0;
  }
  async reorderFooterContent(
    id: number,
    newPosition: number
  ): Promise<boolean> {
    // This requires a transaction and careful handling of positions
    // Simplified logic: just update the position (might lead to gaps/duplicates without full reordering)
    const [content] = await db
      .select({ section: footerContents.section })
      .from(footerContents)
      .where(eq(footerContents.id, id));
    if (!content) return false;

    // A more robust implementation would involve shifting other items
    await db
      .update(footerContents)
      .set({ position: newPosition, updatedAt: new Date() })
      .where(eq(footerContents.id, id));
    // Ideally, re-normalize positions for the section here within a transaction
    return true;
  }

  // Page content operations
  async getPageContents(pageType?: string): Promise<PageContent[]> {
    let query = db.select().from(pageContents);
    if (pageType) query = query.where(eq(pageContents.pageType, pageType));
    return await query.orderBy(
      pageContents.pageType,
      pageContents.section,
      pageContents.position
    );
  }
  async getPageContentsByType(pageType: string): Promise<PageContent[]> {
    return await db
      .select()
      .from(pageContents)
      .where(eq(pageContents.pageType, pageType))
      .orderBy(pageContents.section, pageContents.position);
  }
  async getPageContentsByTypeAndSection(
    pageType: string,
    section: string
  ): Promise<PageContent[]> {
    return await db
      .select()
      .from(pageContents)
      .where(
        and(
          eq(pageContents.pageType, pageType),
          eq(pageContents.section, section)
        )
      )
      .orderBy(pageContents.position);
  }
  async getPageContent(id: number): Promise<PageContent | undefined> {
    const [content] = await db
      .select()
      .from(pageContents)
      .where(eq(pageContents.id, id));
    return content;
  }
  async createPageContent(content: InsertPageContent): Promise<PageContent> {
    const [newContent] = await db
      .insert(pageContents)
      .values(content)
      .returning();
    return newContent;
  }
  async updatePageContent(
    id: number,
    content: Partial<InsertPageContent>
  ): Promise<PageContent | undefined> {
    const [updatedContent] = await db
      .update(pageContents)
      .set({ ...content, updatedAt: new Date() })
      .where(eq(pageContents.id, id))
      .returning();
    return updatedContent;
  }
  async deletePageContent(id: number): Promise<boolean> {
    const result = await db
      .delete(pageContents)
      .where(eq(pageContents.id, id))
      .returning({ id: pageContents.id });
    return result.length > 0;
  }
  async reorderPageContent(id: number, newPosition: number): Promise<boolean> {
    // Similar to footer reordering, requires careful handling or simplification
    const [content] = await db
      .select({
        pageType: pageContents.pageType,
        section: pageContents.section,
      })
      .from(pageContents)
      .where(eq(pageContents.id, id));
    if (!content) return false;
    await db
      .update(pageContents)
      .set({ position: newPosition, updatedAt: new Date() })
      .where(eq(pageContents.id, id));
    // Ideally, re-normalize positions for the section/pageType here
    return true;
  }

  // Database initialization (placeholder, actual seeding might be in separate files)
  async initializeDatabase(): Promise<void> {
    log(
      "DatabaseStorage: Checking if initialization/seeding is needed..."
    );
    // Add logic here if you want DatabaseStorage to handle initial seeding
    // e.g., check if users table is empty and call a seeding function
    const userCount = await db.select({ count: count() }).from(users);
    if (Number(userCount[0]?.count || 0) === 0) {
      log("Database appears empty, consider running a seed script.");
      // Optionally call a seed function here
      await seedDatabase(); // If seedDatabase is defined and exported
    } else {
      log("Database already contains data.");
    }
  }
}

// Export a single instance of the DatabaseStorage
export const storage = new DatabaseStorage();
