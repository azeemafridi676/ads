import { Request, Response } from "express";
import { ApiResponse } from "../types/apiResponse";
import { validateRequiredFields } from "../lib/validation";
import mongoose from "mongoose";
import Campaign from "../models/campaignModel";
import { uploadFileToS3 } from '../services/fileUploadService';
import { NotificationService } from '../services/NotificationService';
import moment from 'moment-timezone';
import { s3 } from '../lib/awsConfig';
import { sendCampaignCycleRunning } from "../services/emailService";
import { sendSubscriptionCompletionEmail } from "../services/emailService";
import { emitNotification, emitSubscriptionEvent, emitCampaignCreated, emitToUser, emitToAdmin } from "../lib/socketConfig";
import Notification from "../models/Notification";

interface GenerateUploadUrlRequest {
    fileName: string;
    fileType: string;
    fileSize: number;
}

if (!process.env.TZ) {
    throw new Error('TZ environment variable must be set');
}
const timezone = process.env.TZ;
const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss [CST]';

export const generateUploadUrl = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fileName, fileType, fileSize } = req.body as GenerateUploadUrlRequest;


        // Validate file type
        if (!fileType.match(/^(image|video)\//)) {
            console.log('Invalid file type:', fileType);
            const response: ApiResponse<null> = {
                status: 400,
                message: "Invalid file type. Only images and videos are allowed.",
                data: null
            };
            res.status(400).json(response);
            return;
        }

        // Generate unique file path
        const fileKey = `campaigns/${Date.now()}-${fileName}`;

        // Generate presigned URL params
        const params = {
            Bucket: process.env.AWS_S3_BUCKET!,
            Key: fileKey,
            ContentType: fileType,
            Expires: 300 // URL expires in 5 minutes
        };

        // Generate presigned URL
        const presignedUrl = await s3.getSignedUrlPromise('putObject', params);

        // Generate the final S3 URL that the file will have after upload
        const finalS3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

        const response: ApiResponse<{ presignedUrl: string; finalS3Url: string }> = {
            status: 200,
            message: "Upload URL generated successfully",
            data: {
                presignedUrl,
                finalS3Url
            }
        };
        res.status(200).json(response);

    } catch (error: any) {
        console.error('Error generating upload URL:', error);
        console.error('Error stack:', error.stack);
        const response: ApiResponse<null> = {
            status: 500,
            message: error.message || "Failed to generate upload URL",
            data: null
        };
        res.status(500).json(response);
    }
};

export const createCampaign = async (req: Request, res: Response): Promise<void> => {
    try {
        const { campaignName, startDateTime, endDateTime, selectedLocations, mediaType, mediaDuration, mediaUrl } = req.body;

        const timezone = process.env.TZ;
        if (!timezone) {
            throw new Error('TZ environment variable must be set');
        }

        // Create moment objects in the specified timezone
        const startDate = moment.tz(startDateTime, timezone);
        const endDate = moment.tz(endDateTime, timezone);
        const currentDate = moment().tz(timezone);

        // Check subscription campaign limit
        const user = (req as any).user;
        const subscription = user.currentSubscription;
        
        if (!subscription) {
            const response: ApiResponse<null> = {
                status: 403,
                message: "Active subscription required to create campaigns",
                data: null
            };
            res.status(403).json(response);
            return;
        }

        // Get count of existing campaigns for this user
        const existingCampaignsCount = await Campaign.countDocuments({ userId: user._id });

        // Check if creating this campaign would exceed the limit
        if (existingCampaignsCount >= subscription.campaignLimit) {
            const response: ApiResponse<null> = {
                status: 400,
                message: `You have reached the maximum campaign limit of ${subscription.campaignLimit} for your subscription`,
                data: null
            };
            res.status(400).json(response);
            return;
        }

        // Validation checks
        if (!mediaUrl) {
            const response: ApiResponse<null> = {
                status: 400,
                message: "Media URL is required",
                data: null
            };
            res.status(400).json(response);
            return;
        }

        if (!startDate.isValid() || !endDate.isValid()) {
            const response: ApiResponse<null> = {
                status: 400,
                message: "Invalid date format",
                data: null
            };
            res.status(400).json(response);
            return;
        }

        const durationInDays = (endDate.toDate().getTime() - startDate.toDate().getTime()) / (1000 * 3600 * 24);

        if (durationInDays > subscription.adCampaignTimeLimit) {
            const response: ApiResponse<null> = {
                status: 400,
                message: `Campaign duration exceeds subscription limit of ${subscription.adCampaignTimeLimit} days`,
                data: null
            };
            res.status(400).json(response);
            return;
        }

        // Parse selectedLocations from string to array if needed
        let parsedLocations = selectedLocations;
        if (typeof selectedLocations === 'string') {
            parsedLocations = JSON.parse(selectedLocations);
        }

        if (parsedLocations.length > subscription.locationLimit) {
            const response: ApiResponse<null> = {
                status: 400,
                message: `Location count exceeds subscription limit of ${subscription.locationLimit}`,
                data: null
            };
            res.status(400).json(response);
            return;
        }

        // Extract just the _id from each location object
        const locationIds = parsedLocations.map((loc: any) => loc._id);

        const campaign = new Campaign({
            campaignName,
            startDateTime: startDate.format(DATE_FORMAT),
            endDateTime: endDate.format(DATE_FORMAT),
            selectedLocations: locationIds,
            mediaType,
            mediaDuration,
            mediaUrl,
            userId: (req as any).user._id,
            status: 'pending',
            approvalStatus: {
                isApproved: false,
                approvedBy: undefined,
                approvedAt: undefined,
                rejectionReason: undefined
            }
        });

        await campaign.save();

        const notificationService = new NotificationService();
        await notificationService.createCampaignNotification(campaign);

        const response: ApiResponse<typeof campaign> = {
            status: 201,
            message: "Campaign created successfully",
            data: campaign
        };
        res.status(201).json(response);

    } catch (error: any) {
        console.error('Error creating campaign:', error);
        const response: ApiResponse<null> = {
            status: 500,
            message: error.message || "Failed to create campaign",
            data: null
        };
        res.status(500).json(response);
    }
};

export const getCampaigns = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        const campaigns = await Campaign.find({ userId })
            .populate('selectedLocations')
            .populate({
                path: 'userId',
                populate: {
                    path: 'currentSubscription',
                    model: 'Subscription'
                }
            })
            .sort({ createdAt: -1 });

        const response: ApiResponse<typeof campaigns> = {
            status: 200,
            message: "Campaigns retrieved successfully",
            data: campaigns
        };
        res.status(200).json(response);

    } catch (error: any) {
        const response: ApiResponse<null> = {
            status: 500,
            message: error.message || "Failed to fetch campaigns",
            data: null
        };
        res.status(500).json(response);
    }
};

export const getCampaignsToReview = async (req: Request, res: Response): Promise<void> => {
    try {
        const { filterStatus } = req.query;
        let campaigns;
        if (filterStatus === 'all') {
            campaigns = await Campaign.find({})
                .populate('selectedLocations')
                .populate({
                    path: 'userId',
                    select: 'firstName lastName currentSubscription',
                    populate: {
                        path: 'currentSubscription',
                        model: 'Subscription'
                    }
                });
        } else {
            campaigns = await Campaign.find({ status: filterStatus })
                .populate('selectedLocations')
                .populate({
                    path: 'userId',
                    select: 'firstName lastName currentSubscription',
                    populate: {
                        path: 'currentSubscription',
                        model: 'Subscription'
                    }
                });
        }
        const response: ApiResponse<typeof campaigns> = {
            status: 200,
            message: "Campaigns retrieved successfully",
            data: campaigns
        };
        res.status(200).json(response);
    } catch (error: any) {
        const response: ApiResponse<null> = {
            status: 500,
            message: error.message || "Failed to fetch campaigns",
            data: null
        };
        res.status(500).json(response);
    }
};

export const getCampaignById = async (req: Request, res: Response): Promise<void> => {
    try {
        const campaign = await Campaign.findOne({
            _id: req.params.id,
            userId: (req as any).user._id
        }).populate('selectedLocations').populate('userId', '-password');

        if (!campaign) {
            const response: ApiResponse<null> = {
                status: 404,
                message: "Campaign not found",
                data: null
            };
            res.status(404).json(response);
            return;
        }

        const response: ApiResponse<typeof campaign> = {
            status: 200,
            message: "Campaign retrieved successfully",
            data: campaign
        };
        res.status(200).json(response);

    } catch (error: any) {
        const response: ApiResponse<null> = {
            status: 500,
            message: error.message || "Failed to fetch campaign",
            data: null
        };
        res.status(500).json(response);
    }
};
export const getCampaignDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const campaign = await Campaign.findOne({
            _id: req.params.id,
        }).populate('selectedLocations').populate('userId', '-password');

        if (!campaign) {
            const response: ApiResponse<null> = {
                status: 404,
                message: "Campaign not found",
                data: null
            };
            res.status(404).json(response);
            return;
        }

        const response: ApiResponse<typeof campaign> = {
            status: 200,
            message: "Campaign retrieved successfully",
            data: campaign
        };
        res.status(200).json(response);

    } catch (error: any) {
        const response: ApiResponse<null> = {
            status: 500,
            message: error.message || "Failed to fetch campaign",
            data: null
        };
        res.status(500).json(response);
    }
};

export const updateCampaign = async (req: Request, res: Response): Promise<void> => {
    try {
        const { campaignName, startDateTime, endDateTime, selectedLocations, mediaType, mediaDuration, mediaUrl } = req.body;

        const timezone = process.env.TZ;
        if (!timezone) {
            throw new Error('TZ environment variable must be set');
        }

        // Create moment objects in the specified timezone
        const startDate = moment.tz(startDateTime, timezone);
        const endDate = moment.tz(endDateTime, timezone);
        const currentDate = moment().tz(timezone);

        // Find existing campaign
        const campaign = await Campaign.findOne({
            _id: req.params.id,
            userId: (req as any).user._id
        });

        if (!campaign) {
            const response: ApiResponse<null> = {
                status: 404,
                message: "Campaign not found",
                data: null
            };
            res.status(404).json(response);
            return;
        }

        // Validation checks
        if (!startDate.isValid() || !endDate.isValid()) {
            const response: ApiResponse<null> = {
                status: 400,
                message: "Invalid date format",
                data: null
            };
            res.status(400).json(response);
            return;
        }

        const subscription = (req as any).user.currentSubscription;
        if (!subscription) {
            const response: ApiResponse<null> = {
                status: 403,
                message: "Active subscription required to update campaigns",
                data: null
            };
            res.status(403).json(response);
            return;
        }

        const durationInDays = (endDate.toDate().getTime() - startDate.toDate().getTime()) / (1000 * 3600 * 24);

        if (durationInDays > subscription.adCampaignTimeLimit) {
            const response: ApiResponse<null> = {
                status: 400,
                message: `Campaign duration exceeds subscription limit of ${subscription.adCampaignTimeLimit} days`,
                data: null
            };
            res.status(400).json(response);
            return;
        }

        // Parse selectedLocations from string to array if needed
        let parsedLocations = selectedLocations;
        if (typeof selectedLocations === 'string') {
            parsedLocations = JSON.parse(selectedLocations);
        }

        if (parsedLocations.length > subscription.locationLimit) {
            const response: ApiResponse<null> = {
                status: 400,
                message: `Location count exceeds subscription limit of ${subscription.locationLimit}`,
                data: null
            };
            res.status(400).json(response);
            return;
        }

        // Extract location IDs
        const locationIds = parsedLocations.map((loc: any) => loc._id);

        // Update campaign
        campaign.campaignName = campaignName;
        campaign.startDateTime = startDate.format(DATE_FORMAT);
        campaign.endDateTime = endDate.format(DATE_FORMAT);
        campaign.selectedLocations = locationIds;
        campaign.mediaType = mediaType;
        campaign.mediaDuration = mediaDuration;
        campaign.mediaUrl = mediaUrl;
        campaign.status = 'pending'; // Reset status to pending for review
        campaign.approvalStatus = {
            isApproved: false,
            approvedBy: undefined,
            approvedAt: undefined,
            rejectionReason: undefined
        };

        await campaign.save();

        // Create notification for update
        const notificationService = new NotificationService();
        await notificationService.createCampaignNotification(campaign);

        const response: ApiResponse<typeof campaign> = {
            status: 200,
            message: "Campaign updated successfully",
            data: campaign
        };
        res.status(200).json(response);

    } catch (error: any) {
        console.error('Error updating campaign:', error);
        const response: ApiResponse<null> = {
            status: 500,
            message: error.message || "Failed to update campaign",
            data: null
        };
        res.status(500).json(response);
    }
};

export const deleteCampaign = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        const isAdmin = user.role === 'admin';
        
        const query: any = {
            _id: req.params.id
        };

        // If not admin, add user ID check and status restrictions
        if (!isAdmin) {
            query.userId = user._id;
            query.status = { $in: ['pending', 'rejected'] };
        } else {
            // Admin can only delete approved campaigns
            query.status = 'approved';
        }

        const campaign = await Campaign.findOneAndDelete(query);

        if (!campaign) {
            const response: ApiResponse<null> = {
                status: 404,
                message: "Campaign not found or cannot be deleted",
                data: null
            };
            res.status(404).json(response);
            return;
        }

        const response: ApiResponse<null> = {
            status: 200,
            message: "Campaign deleted successfully",
            data: null
        };
        res.status(200).json(response);

    } catch (error: any) {
        const response: ApiResponse<null> = {
            status: 500,
            message: error.message || "Failed to delete campaign",
            data: null
        };
        res.status(500).json(response);
    }
};

export const approveCampaign = async (req: Request, res: Response): Promise<void> => {
    try {
        // Populate all necessary fields similar to getCompainsForDriver
        const campaign: any = await Campaign.findById(req.params.id)
            .populate('selectedLocations')
            .populate({
                path: 'userId',
                populate: {
                    path: 'currentSubscription',
                    match: { isCompleted: false }
                }
            });

        if (!campaign) {
            const response: ApiResponse<null> = {
                status: 404,
                message: 'Campaign not found',
                data: null
            };
            res.status(404).json(response);
            return;
        }

        const timezone = process.env.TZ || 'UTC';
        const currentDate = moment().tz(timezone).toDate();

        campaign.approvalStatus.isApproved = true;
        campaign.approvalStatus.approvedBy = (req as any).user._id;
        campaign.approvalStatus.approvedAt = currentDate;
        campaign.status = 'approved';

        await campaign.save();

        // Create campaign data with maxRunCycleLimit
        const campaignData = campaign.toObject();
        campaignData.maxRunCycleLimit = campaign.userId?.currentSubscription?.runCycleLimit || 0;

        // Check if campaign should be immediately active
        const now = moment().tz(timezone);
        const startDate = moment.tz(campaign.startDateTime, DATE_FORMAT, timezone);
        const endDate = moment.tz(campaign.endDateTime, DATE_FORMAT, timezone);

        if (now.isBetween(startDate, endDate, undefined, '[]')) {
            // If campaign is within its time window, emit to drivers
            console.log('Campaign is within time window, preparing to emit:', {
                campaignId: campaign._id,
                campaignName: campaign.campaignName,
                startDateTime: campaign.startDateTime,
                endDateTime: campaign.endDateTime,
                currentTime: now.format()
            });
            
            await emitCampaignCreated(campaignData);
            console.log('Campaign emission completed');
        } else {
            console.log('Campaign is not within its time window');
            console.log('Campaign start date:', campaign.startDateTime);
            console.log('Campaign end date:', campaign.endDateTime);
            console.log('Current date:', currentDate);
            console.log('Now:', now);
            console.log('Result:', now.isBetween(startDate, endDate, undefined, '[]'));
        }

        const notificationService = new NotificationService();
        await notificationService.notifyCampaignStatus(campaign, 'approved')
            .catch(error => {
                console.error('Notification error:', error);
            });

        const response: ApiResponse<typeof campaignData> = {
            status: 200,
            message: "Campaign approved successfully",
            data: campaignData
        };
        res.status(200).json(response);

    } catch (error: any) {
        console.error('Error approving campaign:', error);
        const response: ApiResponse<null> = {
            status: 500,
            message: error.message || "Failed to approve campaign",
            data: null
        };
        res.status(500).json(response);
    }
};
export const rejectCampaign = async (req: Request, res: Response) => {
    try {
        const { rejectionReason } = req.body;
        console.log("rejectionReason", rejectionReason);
        const campaign = await Campaign.findById(req.params.id).populate('userId');
        if (!campaign) {
            const response: ApiResponse<null> = {
                status: 404,
                message: 'Campaign not found',
                data: null
            };
            res.status(404).json(response);
            return;
        }
        campaign.approvalStatus.isApproved = false;
        campaign.approvalStatus.rejectionReason = rejectionReason;
        campaign.status = 'rejected';
        await campaign.save();
        console.log("campaign rejected", campaign);

        // Send notification for campaign rejection
        const notificationService = new NotificationService();
        await notificationService.notifyCampaignStatus(campaign, 'rejected')
            .catch(error => {
                console.error('Notification error:', error);
            });

        const response: ApiResponse<typeof campaign> = {
            status: 200,
            message: "Campaign rejected successfully",
            data: campaign
        };
        res.status(200).json(response);
    } catch (error: any) {
        const response: ApiResponse<null> = {
            status: 500,
            message: error.message || "Failed to reject campaign",
            data: null
        };
        res.status(500).json(response);
    }
};

export const updateCampaignCycleAndLocation = async (req: Request, res: Response): Promise<void> => {
    try {
        const campaignId = req.params.id;
        const { latitude, longitude } = req.body;

        // Validate location data
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            const response: ApiResponse<null> = {
                status: 400,
                message: "Invalid location data",
                data: null
            };
            res.status(400).json(response);
            return;
        }

        // Find campaign and populate user with subscription
        const campaign: any = await Campaign.findById(campaignId).populate({
            path: 'userId',
            populate: { path: 'currentSubscription' }
        });

        if (!campaign) {
            const response: ApiResponse<null> = {
                status: 404,
                message: "Campaign not found",
                data: null
            };
            res.status(404).json(response);
            return;
        }

        // Initialize playedLocations array if it doesn't exist
        if (!campaign.playedLocations) {
            campaign.playedLocations = [];
        }

        // Add played location
        campaign.playedLocations.push({
            latitude,
            longitude,
            playedAt: moment().tz(timezone).format(DATE_FORMAT)
        });

        // Increment campaign's run cycle count
        campaign.runCycleCount += 1;

        // Get the subscription
        const subscription = campaign.userId.currentSubscription;
        
        // Increment subscription's current cycles
        subscription.currentCycles += 1;

        // Check if subscription has reached its cycle limit
        if (subscription.currentCycles >= subscription.runCycleLimit) {
            // Mark subscription as completed
            subscription.isCompleted = true;
            subscription.completedAt = moment().tz(timezone).toDate();
            
            // Find and mark all campaigns under this subscription as completed
            const campaigns = await Campaign.find({
                userId: campaign.userId._id,
                status: { $in: ['approved', 'active', 'scheduled'] }
            });

            for (const camp of campaigns) {
                camp.status = 'completed';
                camp.hasCompletedCycles = true;
                await camp.save();
            }
        }

        // Save both campaign and subscription
        await Promise.all([
            campaign.save(),
            subscription.save()
        ]);

        // Send first run cycle notification
        if (campaign.runCycleCount === 1) {
            console.log('Sending first run cycle notification');
            await sendCampaignCycleRunning({
                email: campaign.userId.email,
                userName: campaign.userId.firstName + ' ' + campaign.userId.lastName,
                campaignName: campaign.campaignName,
                startTime: campaign.startDateTime,
                campaignId: campaign._id.toString()
            });
        }

        // Send subscription completion notification if needed
        if (subscription.isCompleted) {
            // Create notification in DB first
            const notification = await Notification.create({
                recipient: campaign.userId._id,
                type: 'subscription_completed',
                title: 'Subscription Completed',
                message: `Your subscription has completed all campaign cycles`,
                link: '/dashboard/subscriptions',
                data: { subscriptionId: subscription._id }
            });

            // Now emit the saved notification
            await emitNotification(campaign.userId._id.toString(), notification);

            emitSubscriptionEvent(campaign.userId._id.toString(), {
                type: 'completion',
                subscriptionId: subscription._id,
                message: `Subscription ${subscription.planName} has been completed`
            });
            console.log('Sending subscription completion email', subscription.planName);
            await sendSubscriptionCompletionEmail({
                email: campaign.userId.email,
                userName: campaign.userId.firstName + ' ' + campaign.userId.lastName,
                subscriptionName: subscription.planName,
                completedAt: subscription.completedAt
            });
        }

        emitToUser(campaign.userId._id.toString(), 'played_locations_updated', {
            campaignId: campaign._id,
            campaignName: campaign.campaignName,
            campaignCycleCount: campaign.runCycleCount,
            playedLocations: {
                latitude,
                longitude,
                playedAt: moment().tz(timezone).format(DATE_FORMAT)
            },
            subscriptionCompleted: subscription.isCompleted,
            subscriptionId: subscription._id
        });

        emitToAdmin('played_locations_updated_admin', {
            campaignId: campaign._id,
            campaignName: campaign.campaignName,
            campaignCycleCount: campaign.runCycleCount,
            playedLocations: {
                latitude,
                longitude,
                playedAt: moment().tz(timezone).format(DATE_FORMAT)
            },
            subscriptionCompleted: subscription.isCompleted,
            subscriptionId: subscription._id
        });

        const response: ApiResponse<typeof campaign> = {
            status: 200,
            message: "Campaign cycle and location updated successfully",
            data: campaign
        };
        res.status(200).json(response);

    } catch (error: any) {
        console.error('Error updating campaign cycle and location:', error);
        const response: ApiResponse<null> = {
            status: 500,
            message: error.message || "Failed to update campaign cycle and location",
            data: null
        };
        res.status(500).json(response);
    }
};

export const checkCampaignLimit = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        const subscription = user.currentSubscription;
        
        if (!subscription) {
            const response: ApiResponse<null> = {
                status: 403,
                message: "Active subscription required",
                data: null
            };
            res.status(403).json(response);
            return;
        }

        const existingCampaignsCount = await Campaign.countDocuments({ userId: user._id });
        const canCreateMore = existingCampaignsCount < subscription.campaignLimit;

        const response: ApiResponse<{ canCreateMore: boolean; currentCount: number; limit: number }> = {
            status: 200,
            message: canCreateMore ? "Can create more campaigns" : "Campaign limit reached",
            data: {
                canCreateMore,
                currentCount: existingCampaignsCount,
                limit: subscription.campaignLimit
            }
        };
        res.status(200).json(response);

    } catch (error: any) {
        const response: ApiResponse<null> = {
            status: 500,
            message: error.message || "Failed to check campaign limit",
            data: null
        };
        res.status(500).json(response);
    }
};


