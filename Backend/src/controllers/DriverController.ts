import { Request, Response } from 'express';
import Campaign from "../models/campaignModel";
import mongoose from 'mongoose';
import moment from 'moment-timezone';

const timezone = process.env.TZ;
if (!timezone) {
    throw new Error('TZ environment variable must be set');
}

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss [CST]';

export const getCompainsForScreen = async (req: Request, res: Response): Promise<void> => {
    try {
        
        // Always use the specified timezone
        const now = moment().tz(timezone);

        // Find campaigns and filter them
        const campaigns = await Campaign.find({
            $and: [
                { 'approvalStatus.isApproved': true },
                { 
                    status: { 
                        $in: ['approved', 'active', 'scheduled'] 
                    } 
                },
                { hasCompletedCycles: false }
            ]
        }).populate('selectedLocations')
          .populate({
            path: 'userId',
            populate: {
                path: 'currentSubscription',
                match: { isCompleted: false }
            }
          });

        // Filter campaigns based on subscription and run cycle limits
        const filteredCampaigns = campaigns.filter((campaign: any) => {
            // Check if user has an active subscription
            const hasActiveSubscription = campaign.userId?.currentSubscription;
            if (!hasActiveSubscription) return false;

            // Check if campaign is within its run cycle limit
            const currentRunCount = campaign.runCycleCount || 0;
            const runCycleLimit = campaign.userId?.currentSubscription?.runCycleLimit;
            
            // Attach maxRunCycleLimit to the campaign object
            campaign.maxRunCycleLimit = runCycleLimit;
            
            return currentRunCount < runCycleLimit;
        });

        // Filter campaigns based on date after fetching
        const validCampaigns = filteredCampaigns.filter(campaign => {
            const startDate = moment.tz(campaign.startDateTime, DATE_FORMAT, timezone);
            const endDate = moment.tz(campaign.endDateTime, DATE_FORMAT, timezone);
            
            if (!startDate.isValid() || !endDate.isValid()) {
                console.error('Invalid date format in campaign:', campaign._id);
                return false;
            }
            
            return now.isBetween(startDate, endDate, undefined, '[]');
        });

        if (!validCampaigns || validCampaigns.length === 0) {
            res.status(204).json({
                status: 204,
                message: "No available campaigns found",
                data: null
            });
            return;
        }

        res.status(200).json({
            status: 200,
            message: "Campaigns retrieved successfully",
            data: validCampaigns
        });
    } catch (error: any) {
        res.status(500).json({
            status: 500,
            message: error.message || "Failed to fetch campaigns",
            data: null
        });
    }
};

export const updateCampaignDownloadStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { campaignId, downloadedUrl } = req.body;
        const userId = (req as any).user._id;

        if (!campaignId || !mongoose.Types.ObjectId.isValid(campaignId)) {
            res.status(400).json({
                status: 400,
                message: "Invalid campaign ID",
                data: null
            });
            return;
        }

        const updatedCampaign = await Campaign.findByIdAndUpdate(
            campaignId,
            {
                $set: {
                    assignToDriverId: userId,
                    downloadedUrl: downloadedUrl,
                    isDownloaded: true
                }
            },
            { new: true }
        );

        if (!updatedCampaign) {
            res.status(404).json({
                status: 404,
                message: "Campaign not found",
                data: null
            });
            return;
        }

        res.status(200).json({
            status: 200,
            message: "Campaign download status updated successfully",
            data: updatedCampaign
        });
    } catch (error: any) {
        res.status(500).json({
            status: 500,
            message: error.message || "Failed to update campaign download status",
            data: null
        });
    }
};

export const getCompainsForDriver = async (req: Request, res: Response): Promise<void> => {
    try {
        const now = moment().tz(timezone);
        
        const allCampaigns = await Campaign.find({
            hasCompletedCycles: false
        }).populate({
            path: 'userId',
            populate: {
                path: 'currentSubscription',
                match: { isCompleted: false },
                select: 'runCycleLimit currentCycles isCompleted'
            }
        });
        if (!allCampaigns || allCampaigns.length === 0) {
            res.status(404).json({
                status: 404,
                message: `No campaigns found in the database`,
                data: null
            });
            return;
        }

        // Filter campaigns based on date range, daily time window, and subscription status
        const filteredCampaigns = allCampaigns.filter((campaign: any) => {
            // Check if user has an active subscription
            if (!campaign.userId?.currentSubscription) {
                console.log(`Campaign ${campaign._id} filtered out: No active subscription`);
                return false;
            }

            // Attach maxRunCycleLimit to the campaign object
            campaign.maxRunCycleLimit = campaign.userId?.currentSubscription?.runCycleLimit;

            if (!campaign.approvalStatus?.isApproved) {
                console.log(`Campaign ${campaign._id} filtered out: Not approved`);
                return false;
            }

            if (!['approved', 'active', 'scheduled'].includes(campaign.status)) {
                console.log(`Campaign ${campaign._id} filtered out: Invalid status ${campaign.status}`);
                return false;
            }

            // Specify the format when parsing dates
            const campaignStart = moment.tz(campaign.startDateTime, DATE_FORMAT, timezone);
            const campaignEnd = moment.tz(campaign.endDateTime, DATE_FORMAT, timezone);

            // Verify the dates are valid
            if (!campaignStart.isValid() || !campaignEnd.isValid()) {
                console.error(`Campaign ${campaign._id} filtered out: Invalid date format`, {
                    startDateTime: campaign.startDateTime,
                    endDateTime: campaign.endDateTime
                });
                return false;
            }

            const isWithinDateRange = now.isBetween(campaignStart, campaignEnd, 'minute', '[]');
            if (!isWithinDateRange) {
                console.log(`Campaign ${campaign._id} filtered out: Outside date range`, {
                    now: now.format(),
                    start: campaignStart.format(),
                    end: campaignEnd.format()
                });
                return false;
            }

            // Time window check in the specified timezone
            const startTimeInMinutes = campaignStart.hours() * 60 + campaignStart.minutes();
            const endTimeInMinutes = campaignEnd.hours() * 60 + campaignEnd.minutes();
            const currentTimeInMinutes = now.hours() * 60 + now.minutes();

            const isWithinTimeWindow = currentTimeInMinutes >= startTimeInMinutes && 
                                     currentTimeInMinutes <= endTimeInMinutes;

            if (!isWithinTimeWindow) {
                console.log(`Campaign ${campaign._id} filtered out: Outside time window`, {
                    currentTime: `${Math.floor(currentTimeInMinutes/60)}:${currentTimeInMinutes%60}`,
                    startTime: `${Math.floor(startTimeInMinutes/60)}:${startTimeInMinutes%60}`,
                    endTime: `${Math.floor(endTimeInMinutes/60)}:${endTimeInMinutes%60}`
                });
                return false;
            }

            return true;
        });

        if (filteredCampaigns.length === 0) {
            const timeStr = now.format('HH:mm:ss');
            const dateStr = now.format('YYYY-MM-DD');
            res.status(404).json({
                status: 404,
                message: `No active campaigns available for current date (${dateStr}) and time (${timeStr}). Please check back later.`,
                data: null
            });
            return;
        }

        const campaignsWithLocations = await Campaign.populate(filteredCampaigns, 'selectedLocations');
        
        res.status(200).json({
            status: 200,
            message: "Campaigns retrieved successfully",
            data: campaignsWithLocations
        });
    } catch (error: any) {
        res.status(500).json({
            status: 500,
            message: error.message || "Failed to fetch campaigns",
            data: null
        });
    }
};