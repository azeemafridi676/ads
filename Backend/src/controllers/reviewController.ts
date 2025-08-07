import { Request, Response } from 'express';
import Review from '../models/reviewModel';

// Create a new review
export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const reviewData = { ...req.body, user: userId };
    
    const review = await Review.create(reviewData);

    res.status(201).json({
      status: 'success',
      data: review
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all reviews for a user
export const getUserReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const reviews = await Review.find({ user: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: reviews
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all reviews (for admin)
export const getAllReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    
    // Check if user is admin
    if (user.role !== 'admin') {
      res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin only.'
      });
      return;
    }

    const reviews = await Review.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: reviews
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update review status (for admin)
export const updateReviewStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    
    // Check if user is admin
    if (user.role !== 'admin') {
      res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin only.'
      });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    const review = await Review.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!review) {
      res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: review
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete a review
export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;

    // if the user is admin then he can delete any review
    const review = (req as any).user.role === 'admin' 
      ? await Review.findByIdAndDelete(id) 
      : await Review.findOneAndDelete({
          _id: id,
          user: userId
        });

    if (!review) {
      res.status(404).json({
        status: 'error',
        message: 'Review not found or unauthorized'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Review deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getReviewById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;
    
    const review = await Review.findById(id);
    
    if (!review) {
      res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
      return;
    }

    // Check if the user is the owner of the review
    if (review.user.toString() !== userId.toString()) {
      res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this review'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: review
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const updateReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;
    const { rating, duration, comment } = req.body;
    
    const review = await Review.findById(id);
    
    if (!review) {
      res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
      return;
    }

    // Check if the review is already approved
    if (review.status === 'approved') {
      res.status(403).json({
        status: 'error',
        message: 'Cannot edit an approved review'
      });
      return;
    }

    // Check if the user is the owner of the review
    if (review.user.toString() !== userId.toString()) {
      res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this review'
      });
      return;
    }

    // Only allow updating specific fields
    review.rating = rating;
    review.duration = duration;
    review.comment = comment;
    
    // Set status to pending if the review was rejected
    if (review.status === 'rejected') {
      review.status = 'pending';
    }
    
    await review.save();

    res.status(200).json({
      status: 'success',
      data: review
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get approved reviews for public display
export const getApprovedReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 6;
    const skip = (page - 1) * limit;

    // Get total count of approved reviews
    const total = await Review.countDocuments({ status: 'approved' });

    // Get paginated reviews
    const reviews = await Review.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const formattedReviews = reviews.map(review => {
      return {
        name: review.name,
        rating: review.rating,
        duration: review.duration,
        comment: review.comment,
        date: review.createdAt
      };
    });

    res.status(200).json({
      status: 'success',
      data: formattedReviews,
      total,
      page,
      limit
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
