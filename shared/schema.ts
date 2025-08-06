import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
  uuid,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  city: varchar("city", { length: 255 }),
  specialization: text("specialization").array(), // for lawyers
  experience: integer("experience"), // for lawyers
  policeStationCode: varchar("police_station_code", { length: 50 }), // for police
  stats: jsonb("stats").$type<{
    totalCases: number;
    wonCases: number;
    lostCases: number;
  }>(),
  rating: integer("rating"),
  description: text("description"),
  image: varchar("image", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Police stations table
export const policeStations = pgTable("police_stations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  city: varchar("city", { length: 255 }).notNull(),
  address: text("address").notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPoliceStationSchema = createInsertSchema(policeStations).omit({ 
  id: true, 
  createdAt: true 
});
export type PoliceStation = typeof policeStations.$inferSelect;
export type InsertPoliceStation = z.infer<typeof insertPoliceStationSchema>;

// Cases table
export const cases = pgTable("cases", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  caseType: varchar("case_type", { length: 50 }).notNull(),
  victim: jsonb("victim").$type<{
    name: string;
    phone: string;
    email?: string;
  }>().notNull(),
  accused: jsonb("accused").$type<{
    name: string;
    phone?: string;
    address?: string;
  }>().notNull(),
  clientId: uuid("client_id").notNull().references(() => users.id),
  lawyerId: uuid("lawyer_id").references(() => users.id),
  policeStationId: uuid("police_station_id").notNull().references(() => policeStations.id),
  city: varchar("city", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default('draft'),
  pnr: varchar("pnr", { length: 100 }),
  hearingDate: date("hearing_date"),
  documents: text("documents").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCaseSchema = createInsertSchema(cases).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true, 
  pnr: true 
});
export type Case = typeof cases.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;

// Police Station Schema
export const policeStationSchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  code: z.string(), // e.g., DEL-001
  city: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string().email(),
  createdAt: z.date().optional(),
});

export const insertPoliceStationSchema = policeStationSchema.omit({ _id: true, createdAt: true });
export type PoliceStation = z.infer<typeof policeStationSchema>;
export type InsertPoliceStation = z.infer<typeof insertPoliceStationSchema>;

// Message Schema
export const messageSchema = z.object({
  _id: z.string().optional(),
  senderId: z.string(),
  receiverId: z.string(),
  caseId: z.string().optional(),
  content: z.string(),
  timestamp: z.date().optional(),
  read: z.boolean().optional(),
});

export const insertMessageSchema = messageSchema.omit({ _id: true, timestamp: true });
export type Message = z.infer<typeof messageSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Notification Schema
export const notificationSchema = z.object({
  _id: z.string().optional(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.enum(['case_approved', 'case_rejected', 'hearing_scheduled', 'new_message', 'case_created']),
  read: z.boolean().optional(),
  caseId: z.string().optional(),
  createdAt: z.date().optional(),
});

export const insertNotificationSchema = notificationSchema.omit({ _id: true, createdAt: true });
export type Notification = z.infer<typeof notificationSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Login Schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginData = z.infer<typeof loginSchema>;

// Auth Response
export const authResponseSchema = z.object({
  user: userSchema,
  token: z.string(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
