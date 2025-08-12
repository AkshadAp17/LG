import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { EmailService } from '../services/emailService.js';
import { authenticateToken } from '../middleware/auth.js';
import { storage } from '../storage.js';
import { NotificationModel, CaseModel } from '../db.js';
import mongoose from 'mongoose';

// Document schema for file tracking
const documentSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
  caseTitle: String,
  uploadedBy: String,
  uploadedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  size: Number,
  type: String,
  path: String
}, { timestamps: true });

const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);

const router = express.Router();

// Configure multer for file uploads
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed'));
    }
  }
});

// Get all documents for user
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    let filter = {};
    
    // Filter documents based on user role
    if (req.user.role === 'client') {
      // Clients can only see documents for their cases
      const userCases = await CaseModel.find({ clientId: req.user._id });
      const caseIds = userCases.map(case_ => case_._id);
      filter = { caseId: { $in: caseIds } };
    } else if (req.user.role === 'lawyer') {
      // Lawyers can see documents for cases they're assigned to
      const lawyerCases = await CaseModel.find({ lawyerId: req.user._id });
      const caseIds = lawyerCases.map(case_ => case_._id);
      filter = { caseId: { $in: caseIds } };
    }
    // Police can see all documents (no filter needed)

    const documents = await Document.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Upload document
router.post('/upload', authenticateToken, upload.single('document'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { caseId } = req.body;
    if (!caseId) {
      return res.status(400).json({ error: 'Case ID is required' });
    }

    // Get case details
    const case_ = await CaseModel.findById(caseId);
    if (!case_) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Create document record
    const document = new Document({
      filename: req.file.filename,
      originalName: req.file.originalname,
      caseId: caseId,
      caseTitle: case_.title,
      uploadedBy: req.user.name,
      uploadedById: req.user._id,
      size: req.file.size,
      type: req.file.mimetype,
      path: req.file.path
    });

    await document.save();

    // Add document to case
    await storage.addDocumentToCase(caseId, req.file.filename);

    // Send notifications to relevant parties
    try {
      // Create in-app notifications
      const notifications = [];

      if (case_.clientId && case_.clientId.toString() !== req.user._id.toString()) {
        const clientNotification = new NotificationModel({
          title: 'New Document Uploaded',
          message: `A new document "${req.file.originalname}" has been uploaded to your case "${case_.title}"`,
          type: 'document',
          userId: case_.clientId,
          caseId: caseId
        });
        notifications.push(clientNotification);
      }

      if (case_.lawyerId && case_.lawyerId.toString() !== req.user._id.toString()) {
        const lawyerNotification = new NotificationModel({
          title: 'New Document Uploaded',
          message: `A new document "${req.file.originalname}" has been uploaded to case "${case_.title}"`,
          type: 'document',
          userId: case_.lawyerId,
          caseId: caseId
        });
        notifications.push(lawyerNotification);
      }

      await NotificationModel.insertMany(notifications);

      // Send email notifications
      if (case_.clientId && case_.clientId.toString() !== req.user._id.toString()) {
        const client = await storage.getUser(case_.clientId);
        if (client?.email) {
          await EmailService.sendDocumentUploadNotification(
            req.file.originalname,
            case_.title,
            req.user.name,
            client.email,
            'client'
          );
        }
      }

      if (case_.lawyerId && case_.lawyerId.toString() !== req.user._id.toString()) {
        const lawyer = await storage.getUser(case_.lawyerId);
        if (lawyer?.email) {
          await EmailService.sendDocumentUploadNotification(
            req.file.originalname,
            case_.title,
            req.user.name,
            lawyer.email,
            'lawyer'
          );
        }
      }
    } catch (emailError) {
      console.error('Failed to send notifications:', emailError);
      // Don't fail the upload if notifications fail
    }

    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Download document
router.get('/download/:filename', authenticateToken, async (req: any, res) => {
  try {
    const { filename } = req.params;
    const document = await Document.findOne({ filename });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = path.join(process.cwd(), 'uploads', 'documents', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.download(filePath, document.originalName);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// View document (serve file for viewing)
router.get('/view/:filename', authenticateToken, async (req: any, res) => {
  try {
    const { filename } = req.params;
    const document = await Document.findOne({ filename });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = path.join(process.cwd(), 'uploads', 'documents', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Error viewing document:', error);
    res.status(500).json({ error: 'Failed to view document' });
  }
});

// Delete document
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check permissions (only uploader or lawyer can delete)
    if (req.user.role !== 'lawyer' && document.uploadedById.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this document' });
    }

    // Delete file from disk
    const filePath = path.join(process.cwd(), 'uploads', 'documents', document.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from case documents array
    await storage.removeDocumentFromCase(document.caseId, document.filename);

    // Delete document record
    await Document.findByIdAndDelete(req.params.id);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;