import { z } from "zod";

// User Schema
export const userSchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string(),
  role: z.enum(['client', 'lawyer', 'police']),
  city: z.string().optional(),
  specialization: z.array(z.string()).optional(), // for lawyers
  experience: z.number().optional(), // for lawyers
  policeStationCode: z.string().optional(), // for police
  stats: z.object({
    totalCases: z.number(),
    wonCases: z.number(),
    lostCases: z.number(),
  }).optional(),
  rating: z.number().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertUserSchema = userSchema.omit({ _id: true, createdAt: true, updatedAt: true });
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Lawyer Schema
export const lawyerSchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  specialization: z.array(z.string()),
  city: z.string(),
  experience: z.number(),
  rating: z.number(),
  stats: z.object({
    totalCases: z.number(),
    wonCases: z.number(),
    lostCases: z.number(),
  }),
  description: z.string().optional(),
  image: z.string().optional(),
  createdAt: z.date().optional(),
});

export const insertLawyerSchema = lawyerSchema.omit({ _id: true, createdAt: true });
export type Lawyer = z.infer<typeof lawyerSchema>;
export type InsertLawyer = z.infer<typeof insertLawyerSchema>;

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

// Case Schema
export const caseSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  caseType: z.enum(['fraud', 'theft', 'murder', 'civil', 'corporate']),
  victim: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().optional(),
  }),
  accused: z.object({
    name: z.string(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
  clientId: z.string(),
  lawyerId: z.string().optional(),
  policeStationId: z.string(),
  policeStation: policeStationSchema.optional(),
  city: z.string(),
  status: z.enum(['draft', 'submitted', 'under_review', 'approved', 'rejected']),
  pnr: z.string().optional(),
  hearingDate: z.date().optional(),
  documents: z.array(z.string()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertCaseSchema = caseSchema.omit({ _id: true, createdAt: true, updatedAt: true, pnr: true, policeStation: true });
export type Case = z.infer<typeof caseSchema>;
export type InsertCase = z.infer<typeof insertCaseSchema>;

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

// Case Request Schema (for client to lawyer communication)
export const caseRequestSchema = z.object({
  _id: z.string().optional(),
  clientId: z.string(),
  lawyerId: z.string(),
  title: z.string(),
  description: z.string(),
  // Simplified fields - only basic info from client
  victimName: z.string(),
  accusedName: z.string(),
  clientPhone: z.string(),
  clientEmail: z.string().optional(),
  documents: z.array(z.string()).optional(),
  status: z.enum(['pending', 'accepted', 'rejected']).default('pending'),
  lawyerResponse: z.string().optional(),
  // Optional detailed fields (filled by lawyer later)
  caseType: z.enum(['fraud', 'theft', 'murder', 'civil', 'corporate']).optional(),
  victim: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().optional(),
  }).optional(),
  accused: z.object({
    name: z.string(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  city: z.string().optional(),
  policeStationId: z.string().optional(),
  createdAt: z.date().optional(),
});

export const insertCaseRequestSchema = caseRequestSchema.omit({ _id: true, createdAt: true });
export type CaseRequest = z.infer<typeof caseRequestSchema>;
export type InsertCaseRequest = z.infer<typeof insertCaseRequestSchema>;

// Notification Schema
export const notificationSchema = z.object({
  _id: z.string().optional(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.enum(['case_approved', 'case_rejected', 'hearing_scheduled', 'new_message', 'case_created', 'case_request']),
  read: z.boolean().optional(),
  caseId: z.string().optional(),
  caseRequestId: z.string().optional(),
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
