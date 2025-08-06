import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from 'multer';
import path from 'path';
import express from 'express';
import fs from 'fs';
import { storage } from "./storage.js";
import { authenticateToken, requireRole } from './middleware/auth.js';
import connectDB, { CaseModel, NotificationModel } from './db.js';
import { seedDatabase } from './seeder.js';
import { 
  insertUserSchema, loginSchema, insertCaseSchema,
  insertMessageSchema, insertNotificationSchema
} from "@shared/schema.js";
import { sendCaseApprovalEmail, sendCaseRejectionEmail } from './email.js';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database connection and seed data
  await connectDB();
  await seedDatabase();

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      const result = await storage.login(loginData);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ message: error.message || 'Login failed' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.register(userData);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Registration failed' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    res.json(req.user);
  });

  // Lawyers routes
  app.get('/api/lawyers', async (req, res) => {
    try {
      const { city, caseType } = req.query;
      const lawyers = await storage.getLawyers({
        city: city as string,
        caseType: caseType as string,
      });
      res.json(lawyers);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch lawyers' });
    }
  });

  app.get('/api/lawyers/:id', async (req, res) => {
    try {
      const lawyer = await storage.getLawyer(req.params.id);
      if (!lawyer) {
        return res.status(404).json({ message: 'Lawyer not found' });
      }
      res.json(lawyer);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch lawyer' });
    }
  });

  // Cases routes
  app.get('/api/cases', authenticateToken, async (req: any, res) => {
    try {
      const { status } = req.query;
      const filters: any = {};
      
      if (req.user.role === 'client') {
        filters.clientId = req.user._id;
      } else if (req.user.role === 'lawyer') {
        filters.lawyerId = req.user._id;
      }
      
      if (status) {
        filters.status = status;
      }

      const cases = await storage.getCases(filters);
      res.json(cases);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch cases' });
    }
  });

  app.get('/api/cases/:id', authenticateToken, async (req, res) => {
    try {
      const case_ = await storage.getCase(req.params.id);
      if (!case_) {
        return res.status(404).json({ message: 'Case not found' });
      }
      res.json(case_);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch case' });
    }
  });

  app.post('/api/cases', authenticateToken, upload.array('documents', 10), async (req: any, res) => {
    try {
      // Parse JSON fields if they exist
      const parsedBody = { ...req.body };
      if (parsedBody.victim && typeof parsedBody.victim === 'string') {
        parsedBody.victim = JSON.parse(parsedBody.victim);
      }
      if (parsedBody.accused && typeof parsedBody.accused === 'string') {
        parsedBody.accused = JSON.parse(parsedBody.accused);
      }

      const caseData = insertCaseSchema.parse(parsedBody);
      caseData.clientId = req.user._id;
      
      // Handle file uploads
      if (req.files && req.files.length > 0) {
        caseData.documents = req.files.map((file: any) => file.filename);
      }

      const newCase = await storage.createCase(caseData);
      
      // Create notification for police station
      await storage.createNotification({
        userId: req.user._id,
        title: 'Case Created',
        message: `New case "${newCase.title}" has been submitted for review`,
        type: 'case_created',
        caseId: newCase._id,
      });

      res.status(201).json(newCase);
    } catch (error: any) {
      console.error('Case creation error:', error);
      res.status(400).json({ message: error.message || 'Failed to create case' });
    }
  });

  // Document upload route for existing cases
  app.post('/api/cases/documents', authenticateToken, upload.array('documents', 10), async (req: any, res) => {
    try {
      const { caseId } = req.body;
      
      if (!caseId) {
        return res.status(400).json({ message: 'Case ID is required' });
      }

      const case_ = await storage.getCase(caseId);
      if (!case_) {
        return res.status(404).json({ message: 'Case not found' });
      }

      // Check if user has permission to upload to this case
      if (case_.clientId !== req.user._id && req.user.role !== 'lawyer') {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      if (req.files && req.files.length > 0) {
        const newDocuments = req.files.map((file: any) => file.filename);
        const existingDocuments = case_.documents || [];
        
        await storage.updateCase(caseId, {
          documents: [...existingDocuments, ...newDocuments]
        });
      }

      res.json({ message: 'Documents uploaded successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to upload documents' });
    }
  });

  // Police station routes
  app.get('/api/police-stations', async (req, res) => {
    try {
      const { city } = req.query;
      const stations = await storage.getPoliceStations(city as string);
      res.json(stations);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch police stations' });
    }
  });

  // Case approval/rejection (Police only)
  app.patch('/api/cases/:id/approve', authenticateToken, requireRole(['police']), async (req: any, res) => {
    try {
      const caseId = req.params.id;
      const case_ = await storage.getCase(caseId);
      
      if (!case_) {
        return res.status(404).json({ message: 'Case not found' });
      }

      // Generate PNR and hearing date
      const pnr = `PNR-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const hearingDate = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date within 30 days

      const updatedCase = await storage.updateCase(caseId, {
        status: 'approved',
        pnr,
        hearingDate,
      });

      // Send email notifications
      const client = await storage.getUser(case_.clientId);
      if (case_.lawyerId) {
        const lawyer = await storage.getUser(case_.lawyerId);
        if (client && lawyer) {
          try {
            await sendCaseApprovalEmail(
              client.email,
              lawyer.email,
              case_.title,
              pnr,
              hearingDate.toDateString()
            );
          } catch (emailError) {
            console.error('Email sending failed:', emailError);
          }
        }
      }

      // Create notifications
      await storage.createNotification({
        userId: case_.clientId,
        title: 'Case Approved',
        message: `Your case "${case_.title}" has been approved. PNR: ${pnr}`,
        type: 'case_approved',
        caseId,
      });

      res.json(updatedCase);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to approve case' });
    }
  });

  app.patch('/api/cases/:id/reject', authenticateToken, requireRole(['police']), async (req: any, res) => {
    try {
      const caseId = req.params.id;
      const { reason } = req.body;
      const case_ = await storage.getCase(caseId);
      
      if (!case_) {
        return res.status(404).json({ message: 'Case not found' });
      }

      const updatedCase = await storage.updateCase(caseId, {
        status: 'rejected',
      });

      // Send email notifications
      const client = await storage.getUser(case_.clientId);
      if (case_.lawyerId) {
        const lawyer = await storage.getUser(case_.lawyerId);
        if (client && lawyer) {
          try {
            await sendCaseRejectionEmail(
              client.email,
              lawyer.email,
              case_.title,
              reason
            );
          } catch (emailError) {
            console.error('Email sending failed:', emailError);
          }
        }
      }

      // Create notifications
      await storage.createNotification({
        userId: case_.clientId,
        title: 'Case Rejected',
        message: `Your case "${case_.title}" has been rejected. ${reason ? `Reason: ${reason}` : ''}`,
        type: 'case_rejected',
        caseId,
      });

      res.json(updatedCase);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to reject case' });
    }
  });

  // Messages routes
  app.get('/api/messages', authenticateToken, async (req: any, res) => {
    try {
      const { otherUserId } = req.query;
      const messages = await storage.getMessages(req.user._id, otherUserId as string);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch messages' });
    }
  });

  app.post('/api/messages', authenticateToken, async (req: any, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      messageData.senderId = req.user._id;
      
      const message = await storage.createMessage(messageData);
      
      // Create notification for receiver
      await storage.createNotification({
        userId: messageData.receiverId,
        title: 'New Message',
        message: `You have a new message from ${req.user.name}`,
        type: 'new_message',
      });

      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to send message' });
    }
  });

  // Notifications routes
  app.get('/api/notifications', authenticateToken, async (req: any, res) => {
    try {
      const notifications = await storage.getNotifications(req.user._id);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch notifications' });
    }
  });

  app.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: 'Notification marked as read' });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to mark notification as read' });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user._id;
      const userRole = req.user.role;
      
      let stats: any = {};
      
      if (userRole === 'client') {
        const cases = await storage.getCases({ clientId: userId });
        const activeCases = cases.filter(c => c.status === 'approved' || c.status === 'under_review').length;
        const pendingApprovals = cases.filter(c => c.status === 'under_review').length;
        const upcomingHearings = cases.filter(c => 
          c.hearingDate && new Date(c.hearingDate) > new Date()
        ).length;
        
        stats = {
          activeCases,
          pendingApprovals,
          upcomingHearings,
          totalCases: cases.length,
        };
      } else if (userRole === 'police') {
        const casesForReview = await CaseModel.countDocuments({ status: 'under_review' });
        const approvedToday = await CaseModel.countDocuments({
          status: 'approved',
          updatedAt: { $gte: new Date().setHours(0, 0, 0, 0) }
        });
        const rejectedCases = await CaseModel.countDocuments({ status: 'rejected' });
        
        stats = {
          pendingReview: casesForReview,
          approvedToday,
          rejectedCases,
        };
      }
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch dashboard stats' });
    }
  });

  // Serve uploaded files
  app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads')));

  const httpServer = createServer(app);
  return httpServer;
}
