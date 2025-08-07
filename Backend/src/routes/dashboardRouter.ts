import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
    getUserDashboardData,
    getAdminDashboardData
} from '../controllers/dashboardController';

const router = express.Router();

// User routes
router.get('/user', authMiddleware, getUserDashboardData);
// Admin routes
router.get('/admin', authMiddleware, getAdminDashboardData);

export default router;
