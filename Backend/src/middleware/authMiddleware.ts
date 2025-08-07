import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';
import mongoose from 'mongoose';
interface JwtPayload {
  userId: mongoose.Types.ObjectId;
}
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 401,
        message: 'Authorization token is required.',
        data: null,
      });
    }
    const accessToken = authHeader.split(' ')[1];

    if (!accessToken) {
      return res.status(401).json({
        status: 401,
        message: 'Authorization token is required.',
        data: null,
      });
    }
    const decoded = await jwt.verify(accessToken, process.env.JWT_SECRET as string) as JwtPayload;
    if (decoded && decoded.userId) {
      const user = await User.findById(decoded.userId).populate('currentSubscription');
      if (user) {
        (req as any).user = user;
        return next();
      } else {
        return res.status(404).json({
          status: 404,
          message: 'User not found.',
          data: null,
        });
      }
    } else {
      return res.status(401).json({
        status: 401,
        message: 'Invalid authorization token.',
        data: null,
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      status: 401,
      message: 'Unauthorized.',
      data: null,
    });
  }
};
