import { Request, Response } from 'express';
import Notification from '../models/Notification';

export const getAllNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      status: 'success',
      data: notifications
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getUnreadNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const notifications = await Notification.find({ 
      recipient: userId,
      read: false 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: notifications
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const markNotificationsAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { notificationIds } = req.body;
    const userId = (req as any).user._id;

    await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        recipient: userId
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'Notifications marked as read'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const markAllNotificationsAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;

    await Notification.updateMany(
      {
        recipient: userId,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}; 