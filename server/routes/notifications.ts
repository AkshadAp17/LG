import express from 'express';
import { NotificationModel } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all notifications for user
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const notifications = await NotificationModel.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req: any, res) => {
  try {
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', authenticateToken, async (req: any, res) => {
  try {
    await NotificationModel.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const notification = await NotificationModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Create notification (internal use)
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const { title, message, type, userId, caseId, actionUrl } = req.body;
    
    const notification = new NotificationModel({
      title,
      message,
      type: type || 'info',
      userId: userId || req.user._id,
      caseId,
      actionUrl,
      read: false
    });
    
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

export default router;