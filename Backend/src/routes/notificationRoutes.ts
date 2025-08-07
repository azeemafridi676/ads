import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getAllNotifications,
  getUnreadNotifications,
  markNotificationsAsRead,
  markAllNotificationsAsRead
} from '../controllers/NotificationController';

const router = express.Router();

router.use(authMiddleware);

router.get('/all', getAllNotifications);
router.get('/unread', getUnreadNotifications);
router.post('/mark-read', markNotificationsAsRead);
router.post('/mark-all-read', markAllNotificationsAsRead);

export default router; 