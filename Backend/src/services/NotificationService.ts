import Notification from '../models/Notification';
import { emitNotification, emitAdminNotification } from '../lib/socketConfig';
import { sendCampaignStatusUpdate, sendNewChatMessageToAdmin } from './emailService';
import mongoose from 'mongoose';

export class NotificationService {
  async createCampaignNotification(campaign: any) {
    await emitAdminNotification({
      type: 'campaign_created',
      title: 'New Campaign Created',
      message: `A new campaign "${campaign.campaignName}" requires review`,
      link: `/dashboard/admin-campaign-details/${campaign._id}`,
      data: { campaignId: campaign._id }
    });
  }

  async notifyCampaignStatus(campaign: any, status: any) {
    try {
      // Validate user data exists
      if (!campaign.userId || !campaign.userId._id) {
        throw new Error('Invalid user data in campaign');
      }

      // Extract user ID - ensure it's an ObjectId
      const userId = campaign.userId._id instanceof mongoose.Types.ObjectId 
        ? campaign.userId._id 
        : new mongoose.Types.ObjectId(campaign.userId._id);

      // Prepare user details for email
      const userDetails = {
        email: campaign.userId.email,
        userName: `${campaign.userId.firstName || ''} ${campaign.userId.lastName || ''}`.trim(),
        campaignName: campaign.campaignName,
        status: status
      };

      console.log('Campaign Details:', userDetails);

      // Send email notification
      if (userDetails.email) {
        await sendCampaignStatusUpdate(userDetails);
      }

      // Create notification object
      const notificationData = {
        recipient: userId,
        type: `campaign_${status}`,
        title: `Campaign ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        link: `/dashboard/campaign-details/${campaign._id}`,
        message: `Your campaign "${campaign.campaignName}" has been ${status}`,
        data: { campaignId: campaign._id }
      };

      // Create notification in database
      const createdNotification = await Notification.create(notificationData);

      // Emit socket notification with the created notification
      await emitNotification(userId.toString(), createdNotification);

    } catch (error) {
      console.error('Notification service error:', error);
      throw error;
    }
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    return await Notification.find({ recipient: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  }

  async markAsRead(notificationIds: string[]) {
    return await Notification.updateMany(
      { _id: { $in: notificationIds.map(id => new mongoose.Types.ObjectId(id)) } },
      { read: true, readAt: new Date() }
    );
  }
} 