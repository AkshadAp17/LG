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
  insertMessageSchema, insertNotificationSchema, insertCaseRequestSchema
} from "@shared/schema.js";
import { sendCaseApprovalEmail, sendCaseRejectionEmail } from './email.js';
import notificationRoutes from "./routes/notifications.js";
import documentRoutes from "./routes/documents.js";

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
  // Static file serving for uploads
  app.use('/uploads', express.static('uploads'));
  
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
      console.error('Registration error:', error.message);
      res.status(400).json({ message: error.message || 'Registration failed' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    res.json(req.user);
  });

  // Forgot password routes (simplified - no OTP required)
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      if (!email || !newPassword) {
        return res.status(400).json({ message: 'Email and new password are required' });
      }

      // Direct password reset without OTP verification
      const success = await storage.directPasswordReset(email, newPassword);
      if (success) {
        res.json({ message: 'Password reset successfully' });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to reset password' });
    }
  });

  // Police Stations routes
  app.get('/api/police-stations', async (req, res) => {
    try {
      const { city } = req.query;
      const policeStations = await storage.getPoliceStations(city as string);
      res.json(policeStations);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch police stations' });
    }
  });

  app.get('/api/police-stations/:id', async (req, res) => {
    try {
      const policeStation = await storage.getPoliceStation(req.params.id);
      if (!policeStation) {
        return res.status(404).json({ message: 'Police station not found' });
      }
      res.json(policeStation);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch police station' });
    }
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

  // Get users by role (for messaging)
  app.get("/api/users", async (req, res) => {
    try {
      const { role } = req.query;
      
      if (role) {
        // If role is specified, filter by role
        const users = await storage.getUsersByRole(role as string);
        res.json(users);
      } else {
        // If no role specified, return all users (for messaging)
        const users = await storage.getAllUsers();
        res.json(users);
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
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
      } else if (req.user.role === 'police') {
        // Police can see all cases for review - no clientId/lawyerId filter
        // They primarily see cases that need approval
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

  // Get individual police station by ID
  app.get('/api/police-stations/:id', async (req, res) => {
    try {
      const stationId = req.params.id;
      const station = await storage.getPoliceStation(stationId);
      if (!station) {
        return res.status(404).json({ message: 'Police station not found' });
      }
      res.json(station);
    } catch (error: any) {
      console.error('Police station fetch error:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch police station' });
    }
  });

  // Case approval/rejection (Police only)
  app.post('/api/cases/:id/approve', authenticateToken, requireRole(['police']), async (req: any, res) => {
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

  // Delete case route
  app.delete('/api/cases/:id', authenticateToken, async (req: any, res) => {
    try {
      const caseId = req.params.id;
      const case_ = await storage.getCase(caseId);
      
      if (!case_) {
        return res.status(404).json({ message: 'Case not found' });
      }
      
      // Check if user has permission to delete the case
      if (req.user.role === 'client' && case_.clientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this case' });
      }
      
      if (req.user.role === 'lawyer' && case_.lawyerId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this case' });
      }
      
      // Police can delete any case
      
      // Delete the case
      await CaseModel.findByIdAndDelete(caseId);
      
      // Create notification
      const recipientId = req.user.role === 'client' ? case_.lawyerId : case_.clientId;
      if (recipientId) {
        await storage.createNotification({
          userId: recipientId,
          title: 'Case Deleted',
          message: `Case "${case_.title}" has been deleted by ${req.user.name}`,
          type: 'case_deleted',
          caseId: caseId,
        });
      }
      
      res.json({ message: 'Case deleted successfully' });
    } catch (error: any) {
      console.error('Case deletion error:', error);
      res.status(400).json({ message: error.message || 'Failed to delete case' });
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
      const messageData = {
        receiverId: req.body.receiverId,
        content: req.body.content,
        caseId: req.body.caseId,
        senderId: req.user._id,
      };
      
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
      console.error('Message creation error:', error);
      res.status(400).json({ message: error.message || 'Failed to send message' });
    }
  });

  app.delete('/api/messages', authenticateToken, async (req: any, res) => {
    try {
      await storage.deleteAllMessages();
      res.json({ message: 'All messages deleted successfully' });
    } catch (error: any) {
      console.error('Message deletion error:', error);
      res.status(500).json({ message: error.message || 'Failed to delete messages' });
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

  // Delete all read notifications for user
  app.delete('/api/notifications/read/all', authenticateToken, async (req: any, res) => {
    try {
      await storage.deleteReadNotifications(req.user._id);
      res.json({ message: 'All read notifications deleted' });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to delete read notifications' });
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

  // Case Request routes (for client-lawyer communication)
  app.get('/api/case-requests', authenticateToken, async (req: any, res) => {
    try {
      const filters: any = {};
      
      if (req.user.role === 'client') {
        filters.clientId = req.user._id;
      } else if (req.user.role === 'lawyer') {
        filters.lawyerId = req.user._id;
      }
      
      if (req.query.status) {
        filters.status = req.query.status;
      }
      
      const requests = await storage.getCaseRequests(filters);
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch case requests' });
    }
  });

  app.get('/api/case-requests/:id', authenticateToken, async (req: any, res) => {
    try {
      const request = await storage.getCaseRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: 'Case request not found' });
      }
      
      // Check if user has access to this request
      if (req.user.role === 'client' && request.clientId !== req.user._id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (req.user.role === 'lawyer' && request.lawyerId !== req.user._id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(request);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch case request' });
    }
  });

  app.post('/api/case-requests', authenticateToken, requireRole(['client']), async (req: any, res) => {
    try {
      const requestData = {
        ...req.body,
        clientId: req.user._id,
      };
      
      const request = await storage.createCaseRequest(requestData);
      
      // Create notification for the lawyer
      await storage.createNotification({
        userId: requestData.lawyerId,
        title: 'New Case Request',
        message: `You have received a new case request from ${req.user.name}: ${requestData.title}`,
        type: 'case_request',
        caseRequestId: request._id,
      });
      
      res.status(201).json(request);
    } catch (error: any) {
      console.error('Case request creation error:', error);
      res.status(400).json({ message: error.message || 'Failed to create case request' });
    }
  });

  app.patch('/api/case-requests/:id', authenticateToken, requireRole(['lawyer']), async (req: any, res) => {
    try {
      const { status, lawyerResponse, autoCreateCase = true, caseDetails } = req.body;
      
      // Verify lawyer owns this request
      const existingRequest = await storage.getCaseRequest(req.params.id);
      if (!existingRequest || existingRequest.lawyerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const updatedRequest = await storage.updateCaseRequest(req.params.id, {
        status,
        lawyerResponse,
      });
      
      if (!updatedRequest) {
        return res.status(404).json({ message: 'Case request not found' });
      }
      
      // Create notification for client
      const notificationMessage = status === 'accepted' 
        ? `Your case request "${updatedRequest.title}" has been accepted by ${req.user.name}`
        : `Your case request "${updatedRequest.title}" has been rejected by ${req.user.name}`;
        
      await storage.createNotification({
        userId: updatedRequest.clientId,
        title: status === 'accepted' ? 'Case Request Accepted' : 'Case Request Rejected',
        message: notificationMessage,
        type: 'case_request',
        caseRequestId: updatedRequest._id,
      });
      
      let newCase = null;
      
      // If accepted and auto-create is enabled, create the case with submitted status
      if (status === 'accepted' && autoCreateCase) {
        // Check if a case already exists for this case request
        const existingCases = await storage.getCases({ clientId: updatedRequest.clientId, lawyerId: updatedRequest.lawyerId });
        const hasExistingCase = existingCases.some(c => 
          c.title === updatedRequest.title && 
          c.description === updatedRequest.description
        );
        
        if (hasExistingCase) {
          return res.status(400).json({ 
            message: 'A case with similar details already exists for this client-lawyer pair',
            caseRequest: updatedRequest,
            createdCase: null
          });
        }

        // Get client info for city and police station assignment
        const client = await storage.getUser(updatedRequest.clientId);
        if (!client) {
          throw new Error('Client not found');
        }

        // Debug: Log the actual request data to understand what we have
        console.log('Case Request Data:', {
          victimName: updatedRequest.victimName,
          accusedName: updatedRequest.accusedName,
          clientPhone: updatedRequest.clientPhone,
          clientEmail: updatedRequest.clientEmail,
          victim: updatedRequest.victim,
          accused: updatedRequest.accused
        });

        // Find a police station in the client's city, or use any available station
        let policeStations = await storage.getPoliceStations(client.city);
        if (policeStations.length === 0) {
          // If no stations in client's city, get all available stations
          policeStations = await storage.getAllPoliceStations();
          if (policeStations.length === 0) {
            throw new Error('No police stations available in the system');
          }
        }

        // Ensure all required fields are populated with fallbacks
        const victimName = updatedRequest.victimName || updatedRequest.victim?.name || client.name || 'Client';
        const victimPhone = updatedRequest.victim?.phone || updatedRequest.clientPhone || client.phone || 'Not provided';
        const accusedName = updatedRequest.accusedName || updatedRequest.accused?.name || 'Unknown';

        console.log('Resolved data:', { victimName, victimPhone, accusedName });

        const caseData = {
          title: updatedRequest.title,
          description: updatedRequest.description,
          caseType: updatedRequest.caseType || caseDetails?.caseType || 'civil' as const,
          victim: {
            name: victimName,
            phone: victimPhone,
            email: updatedRequest.victim?.email || updatedRequest.clientEmail || client.email || ''
          },
          accused: {
            name: accusedName,
            phone: updatedRequest.accused?.phone || caseDetails?.accusedPhone || '',
            address: updatedRequest.accused?.address || caseDetails?.accusedAddress || ''
          },
          city: updatedRequest.city || client.city || '',
          policeStationId: updatedRequest.policeStationId || policeStations[0]._id || '',
          documents: updatedRequest.documents || [],
          clientId: updatedRequest.clientId,
          lawyerId: updatedRequest.lawyerId,
          status: 'submitted' as const,
          pnr: caseDetails?.pnr || `PNR${Date.now()}`, // Auto-generate PNR if not provided
          hearingDate: caseDetails?.hearingDate ? new Date(caseDetails.hearingDate) : undefined,
        };
        
        console.log('Final case data:', caseData);
        newCase = await storage.createCase(caseData);
        
        // Notify client about case creation
        await storage.createNotification({
          userId: updatedRequest.clientId,
          title: 'Case Created',
          message: `Your case "${newCase.title}" has been created and submitted for police review`,
          type: 'case_created',
          caseId: newCase._id,
        });
      }
      
      res.json({ 
        caseRequest: updatedRequest,
        createdCase: newCase 
      });
    } catch (error: any) {
      console.error('Case request update error:', error);
      res.status(400).json({ message: error.message || 'Failed to update case request' });
    }
  });

  // Create case from case request with detailed information
  app.post('/api/case-requests/:id/create-case', authenticateToken, requireRole(['lawyer']), async (req: any, res) => {
    try {
      const caseRequestId = req.params.id;
      const caseDetails = req.body;
      
      // Get the case request
      const caseRequest = await storage.getCaseRequest(caseRequestId);
      if (!caseRequest) {
        return res.status(404).json({ message: 'Case request not found' });
      }
      
      // Verify lawyer owns this request
      if (caseRequest.lawyerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Get client info
      const client = await storage.getUser(caseRequest.clientId);
      if (!client) {
        throw new Error('Client not found');
      }

      // Find police station in client's city, or use any available station
      let policeStations = await storage.getPoliceStations(client.city);
      if (policeStations.length === 0) {
        policeStations = await storage.getAllPoliceStations();
        if (policeStations.length === 0) {
          throw new Error('No police stations available in the system');
        }
      }
      
      let policeStationId = caseDetails.policeStationId;
      if (!policeStationId && policeStations.length > 0) {
        policeStationId = policeStations[0]._id;
      }

      // Ensure all required fields are populated with fallbacks
      const victimName = caseDetails.victimName || caseRequest.victimName || client.name || 'Client';
      const victimPhone = caseDetails.victimPhone || caseRequest.clientPhone || client.phone || 'Not provided';
      const accusedName = caseDetails.accusedName || caseRequest.accusedName || 'Unknown';

      // Create comprehensive case data with client details preserved
      const caseData = {
        title: caseDetails.title || caseRequest.title,
        description: caseDetails.description || caseRequest.description,
        caseType: caseDetails.caseType || caseRequest.caseType || 'civil' as const,
        victim: {
          name: victimName,
          phone: victimPhone,
          email: caseDetails.victimEmail || caseRequest.clientEmail || client.email || ''
        },
        accused: {
          name: accusedName,
          phone: caseDetails.accusedPhone || '',
          address: caseDetails.accusedAddress || ''
        },
        city: caseDetails.city || client.city || '',
        policeStationId: policeStationId,
        documents: caseDetails.documents || caseRequest.documents || [],
        clientId: caseRequest.clientId,
        lawyerId: caseRequest.lawyerId,
        status: 'submitted' as const,
        pnr: caseDetails.pnr || `PNR${Date.now()}${Math.floor(Math.random() * 1000)}`,
        hearingDate: caseDetails.hearingDate ? new Date(caseDetails.hearingDate) : undefined,
      };
      
      const newCase = await storage.createCase(caseData);
      
      // Update case request status to accepted if not already
      if (caseRequest.status !== 'accepted') {
        await storage.updateCaseRequest(caseRequestId, {
          status: 'accepted',
          lawyerResponse: 'Case has been created and submitted for review',
        });
      }
      
      // Notify client about case creation
      await storage.createNotification({
        userId: caseRequest.clientId,
        title: 'Case Created',
        message: `Your case "${newCase.title}" has been created and submitted for police review. PNR: ${newCase.pnr}`,
        type: 'case_created',
        caseId: newCase._id,
      });
      
      res.status(201).json({
        case: newCase,
        message: 'Case created successfully with client details'
      });
    } catch (error: any) {
      console.error('Case creation error:', error);
      res.status(400).json({ message: error.message || 'Failed to create case' });
    }
  });

  // Get detailed case request with client information
  app.get('/api/case-requests/:id/details', authenticateToken, async (req: any, res) => {
    try {
      const caseRequest = await storage.getCaseRequest(req.params.id);
      if (!caseRequest) {
        return res.status(404).json({ message: 'Case request not found' });
      }
      
      // Get client and lawyer details
      const client = await storage.getUser(caseRequest.clientId);
      const lawyer = await storage.getUser(caseRequest.lawyerId);
      
      // Get police stations in client's city
      const policeStations = client?.city ? await storage.getPoliceStations(client.city) : [];
      
      res.json({
        ...caseRequest,
        clientDetails: client,
        lawyerDetails: lawyer,
        availablePoliceStations: policeStations
      });
    } catch (error: any) {
      console.error('Error fetching case request details:', error);
      res.status(500).json({ message: 'Failed to fetch case request details' });
    }
  });

  // Add new routes
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/documents', documentRoutes);

  // Serve uploaded files
  app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads')));

  const httpServer = createServer(app);
  return httpServer;
}
