import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { 
    getMessages, 
    getAdminThreads,
    getAdminMessages,
    sendMessageToAdmin,
    sendMessageToUser,
    markMessagesAsRead,
    createOrGetChatThread,
    getThreadById
} from '../controllers/ChatController';

const router = express.Router();

// Admin routes
router.get('/admin/threads', authMiddleware, getAdminThreads);
router.get('/get-messages',authMiddleware, getMessages);
router.get('/get-admin-messages',authMiddleware, getAdminMessages);
router.post('/send-message-to-admin',authMiddleware, sendMessageToAdmin);
router.post('/send-message-to-user',authMiddleware, sendMessageToUser);
router.post('/mark-messages-read', authMiddleware, markMessagesAsRead);
router.post('/admin/create-thread', authMiddleware, createOrGetChatThread);
router.get('/admin/thread/:threadId', authMiddleware, getThreadById);

export default router;
