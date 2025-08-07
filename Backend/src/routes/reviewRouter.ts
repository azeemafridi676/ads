import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  createReview,
  getUserReviews,
  getAllReviews,
  updateReviewStatus,
  deleteReview,
  getReviewById,
  updateReview,
  getApprovedReviews
} from '../controllers/reviewController';

const router = express.Router();

// Public routes (no auth required)
router.get('/approved', getApprovedReviews);

// Protected routes
router.use(authMiddleware);

// Routes
router.post('/', createReview);
router.get('/my-reviews', getUserReviews);
router.get('/all', getAllReviews);
router.get('/:id', getReviewById);
router.put('/:id', updateReview);
router.patch('/:id/status', updateReviewStatus);
router.delete('/:id', deleteReview);

export default router;
