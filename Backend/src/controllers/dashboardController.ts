import { Request, Response } from 'express';
import Campaign from '../models/campaignModel';
import Location from '../models/locationModel';
import User from '../models/userModel';
import { ISubscription } from '../models/subscriptionModel';
import moment from 'moment-timezone';
import mongoose from 'mongoose';
import Invoice from '../models/invoiceModel';

// Define interface for populated user
interface PopulatedUser extends mongoose.Document {
    currentSubscription: ISubscription;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
}

export const getUserDashboardData = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        const timezone = process.env.TZ || 'UTC';
        const currentDate = moment().tz(timezone);
        
        // Get start and end of current month
        const currentMonthStart = moment().tz(timezone).startOf('month');
        const currentMonthEnd = moment().tz(timezone).endOf('month');
        
        // Get start and end of last month
        const lastMonthStart = moment().tz(timezone).subtract(1, 'month').startOf('month');
        const lastMonthEnd = moment().tz(timezone).subtract(1, 'month').endOf('month');

        // Get current month stats
        const currentMonthStats = await Campaign.aggregate([
            {
                $match: {
                    userId,
                    createdAt: { 
                        $gte: currentMonthStart.toDate(),
                        $lte: currentMonthEnd.toDate()
                    },
                    status: { $in: ['active', 'approved'] },
                    'approvalStatus.isApproved': true
                }
            },
            {
                $group: {
                    _id: null,
                    currentActiveCampaigns: { $sum: 1 },
                    currentViews: { $sum: "$runCycleCount" }
                }
            }
        ]);

        // Get previous month stats
        const previousMonthStats = await Campaign.aggregate([
            {
                $match: {
                    userId,
                    createdAt: {
                        $gte: lastMonthStart.toDate(),
                        $lte: lastMonthEnd.toDate()
                    },
                    status: { $in: ['active', 'approved'] },
                    'approvalStatus.isApproved': true
                }
            },
            {
                $group: {
                    _id: null,
                    previousActiveCampaigns: { $sum: 1 },
                    previousViews: { $sum: "$runCycleCount" }
                }
            }
        ]);

        // Get location growth
        const currentLocations = await Location.countDocuments({
            userId,
            createdAt: { 
                $gte: currentMonthStart.toDate(),
                $lte: currentMonthEnd.toDate()
            }
        });

        const previousLocations = await Location.countDocuments({
            userId,
            createdAt: {
                $gte: lastMonthStart.toDate(),
                $lte: lastMonthEnd.toDate()
            }
        });

        // Calculate growth percentages and trends
        const growth = {
            campaigns: calculateGrowth(
                currentMonthStats[0]?.currentActiveCampaigns || 0,
                previousMonthStats[0]?.previousActiveCampaigns || 0,
                lastMonthStart.format('MMMM')
            ),
            locations: calculateGrowth(
                currentLocations,
                previousLocations,
                lastMonthStart.format('MMMM')
            ),
            views: calculateGrowth(
                currentMonthStats[0]?.currentViews || 0,
                previousMonthStats[0]?.previousViews || 0,
                lastMonthStart.format('MMMM')
            )
        };

        // Get user with subscription details
        const user = await User.findById(userId)
            .populate<{ currentSubscription: ISubscription }>('currentSubscription')
            .lean() as PopulatedUser;

        // Get active campaigns count and total views
        const campaignStats = await Campaign.aggregate([
            { $match: { 
                userId,
                status: { $in: ['active', 'approved'] },
                'approvalStatus.isApproved': true
            }},
            { $group: {
                _id: null,
                activeCampaigns: { $sum: 1 },
                totalViews: { $sum: '$runCycleCount' }
            }}
        ]);

        // Get active locations count
        const activeLocations = await Location.countDocuments({ userId });

        // Get recent campaigns
        const recentCampaigns = await Campaign.find({ userId })
            .populate('selectedLocations')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // Get campaign performance data (last 6 months)
        const sixMonthsAgo = moment().tz(timezone).subtract(6, 'months').startOf('month');
        const campaignPerformance = await Campaign.aggregate([
            {
                $match: {
                    userId,
                    createdAt: { $gte: sixMonthsAgo.toDate() }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    views: { $sum: '$runCycleCount' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        // Get location distribution
        const states = await Location.distinct('state', { userId });
        const stateDistribution: { state: string; count: number }[] = [];

        for (const state of states) {
            const count = await Location.countDocuments({ userId, state });
            stateDistribution.push({ state, count });
        }

        const formattedLocationDistribution = {
            labels: stateDistribution.map(item => item.state),
            data: stateDistribution.map(item => item.count)
        };

        // Calculate subscription usage and days remaining
        const currentPlan = {
            planName: user?.currentSubscription?.planName || 'No Active Plan',
            usagePercentage: calculateUsagePercentage(activeLocations, user?.currentSubscription?.locationLimit || 0),
            daysRemaining: calculateDaysRemaining(user?.subscriptionStartDate, user?.subscriptionEndDate)
        };

        const response = {
            status: 200,
            message: "Dashboard data retrieved successfully",
            data: {
                activeCampaigns: campaignStats[0]?.activeCampaigns || 0,
                activeLocations,
                totalViews: campaignStats[0]?.totalViews || 0,
                currentPlan,
                recentCampaigns: recentCampaigns.map(campaign => ({
                    name: campaign.campaignName,
                    locations: campaign.selectedLocations.length,
                    views: campaign.runCycleCount,
                    status: campaign.status,
                    date: moment(campaign.createdAt).format('YYYY-MM-DD'),
                    startDateTime: campaign.startDateTime,
                    endDateTime: campaign.endDateTime
                })),
                chartData: {
                    campaignPerformance: {
                        labels: campaignPerformance.map(item => moment().month(item._id - 1).format('MMM')),
                        data: campaignPerformance.map(item => item.views)
                    },
                    locationDistribution: formattedLocationDistribution
                },
                growth
            }
        };

        res.status(200).json(response);

    } catch (error: any) {
        console.error('Dashboard Error:', error);
        res.status(500).json({
            status: 500,
            message: error.message || "Error retrieving dashboard data",
            data: null
        });
    }
};

export const getAdminDashboardData = async (req: Request, res: Response): Promise<void> => {
    try {
        const timezone = process.env.TZ || 'UTC';
        const currentDate = moment().tz(timezone);
        const lastMonthDate = moment().tz(timezone).subtract(1, 'month');

        // Get total users count (excluding admins)
        const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });

        // Get active campaigns count and total views
        const campaignStats = await Campaign.aggregate([
            {
                $match: {
                    status: { $in: ['active', 'approved'] },
                    'approvalStatus.isApproved': true
                }
            },
            {
                $group: {
                    _id: null,
                    totalCampaigns: { $sum: 1 },
                    totalViews: { $sum: '$runCycleCount' }
                }
            }
        ]);

        // Get total active locations
        const totalLocations = await Location.countDocuments();

        // First, let's get all paid invoices
        const allPaidInvoices = await Invoice.find({ 
            status: 'paid'
        }).lean();

        // Get total revenue (sum of all paid invoices)
        const totalRevenue = await Invoice.aggregate([
            {
                $match: {
                    status: 'paid'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        // Get current month revenue
        const currentMonthRevenue = await Invoice.aggregate([
            {
                $match: {
                    status: 'paid',
                    createdAt: { 
                        $gte: moment().tz(timezone).startOf('month').toDate(),
                        $lte: moment().tz(timezone).endOf('month').toDate()
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        // Get previous month revenue
        const previousMonthRevenue = await Invoice.aggregate([
            {
                $match: {
                    status: 'paid',
                    createdAt: { 
                        $gte: moment().tz(timezone).subtract(1, 'month').startOf('month').toDate(),
                        $lte: moment().tz(timezone).subtract(1, 'month').endOf('month').toDate()
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        // Get current month users
        const currentMonthUsers = await User.countDocuments({
            createdAt: { 
                $gte: moment().tz(timezone).startOf('month').toDate(),
                $lte: moment().tz(timezone).endOf('month').toDate()
            }
        });

        // Get previous month users
        const previousMonthUsers = await User.countDocuments({
            createdAt: { 
                $gte: moment().tz(timezone).subtract(1, 'month').startOf('month').toDate(),
                $lte: moment().tz(timezone).subtract(1, 'month').endOf('month').toDate()
            }
        });

        // Get current month campaigns
        const currentMonthCampaigns = await Campaign.countDocuments({
            createdAt: { 
                $gte: moment().tz(timezone).startOf('month').toDate(),
                $lte: moment().tz(timezone).endOf('month').toDate()
            }
        });

        // Get previous month campaigns
        const previousMonthCampaigns = await Campaign.countDocuments({
            createdAt: { 
                $gte: moment().tz(timezone).subtract(1, 'month').startOf('month').toDate(),
                $lte: moment().tz(timezone).subtract(1, 'month').endOf('month').toDate()
            }
        });

        // Calculate growth percentages
        const lastMonthName = moment().tz(timezone).subtract(1, 'month').format('MMMM');
        const growth = {
            users: calculateGrowth(
                currentMonthUsers,
                previousMonthUsers,
                lastMonthName
            ),
            revenue: calculateGrowth(
                currentMonthRevenue[0]?.total || 0,
                previousMonthRevenue[0]?.total || 0,
                lastMonthName
            ),
            campaigns: calculateGrowth(
                currentMonthCampaigns,
                previousMonthCampaigns,
                lastMonthName
            )
        };

        // Get subscription distribution
        const subscriptionDistribution = await User.aggregate([
            {
                $lookup: {
                    from: 'subscriptions',
                    localField: 'currentSubscription',
                    foreignField: '_id',
                    as: 'subscription'
                }
            },
            {
                $unwind: '$subscription'
            },
            {
                $group: {
                    _id: '$subscription.planName',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get users list with their subscription details
        const users = await User.aggregate([
            {
                $match: {
                    currentSubscription: { $exists: true },
                    subscriptionStatus: 'active'
                }
            },
            {
                $lookup: {
                    from: 'subscriptions',
                    localField: 'currentSubscription',
                    foreignField: '_id',
                    as: 'subscription'
                }
            },
            {
                $unwind: '$subscription'
            },
            {
                $match: {
                    'subscription.planType': 'paid'
                }
            },
            {
                $project: {
                    _id: 1,
                    email: 1,
                    firstName: 1,
                    lastName: 1,
                    createdAt: 1,
                    subscriptionStatus: 1,
                    'subscription.planName': 1,
                    'subscription.locationLimit': 1,
                    'subscription.price': 1,
                    subscriptionEndDate: 1
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $limit: 5 // Limiting to 5 users with active subscriptions
            }
        ]);

        // Get monthly revenue data for the last 6 months
        const sixMonthsAgo = moment().tz(timezone).subtract(5, 'months').startOf('month');
        const monthlyRevenue = await Invoice.aggregate([
            {
                $match: {
                    status: 'paid',
                    createdAt: { 
                        $gte: sixMonthsAgo.toDate(),
                        $lte: moment().tz(timezone).endOf('month').toDate()
                    }
                }
            },
            {
                $group: {
                    _id: { 
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Format monthly revenue data for chart
        const revenueChartData = {
            labels: monthlyRevenue.map(item => 
                moment().month(item._id.month - 1).format('MMM')
            ),
            data: monthlyRevenue.map(item => item.total)
        };

        // Format response
        const response = {
            status: 200,
            message: "Admin dashboard data retrieved successfully",
            data: {
                stats: {
                    totalUsers,
                    totalCampaigns: campaignStats[0]?.totalCampaigns || 0,
                    totalLocations,
                    totalViews: campaignStats[0]?.totalViews || 0,
                    totalRevenue: totalRevenue[0]?.total || 0,
                    currentMonthRevenue: currentMonthRevenue[0]?.total || 0,
                    growth
                },
                chartData: {
                    revenueChart: revenueChartData,
                    subscriptionDistribution: {
                        labels: subscriptionDistribution.map(item => item._id),
                        data: subscriptionDistribution.map(item => item.count)
                    }
                },
                users: users.map(user => ({
                    id: user._id,
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    status: user.subscriptionStatus,
                    joinDate: user.createdAt,
                    subscription: user.subscription?.planName || 'No Plan',
                    locationLimit: user.subscription?.locationLimit || 0,
                    subscriptionEndDate: user.subscriptionEndDate,
                    price: user.subscription?.price || 0
                }))
            }
        };

        res.status(200).json(response);

    } catch (error: any) {
        console.error('Admin Dashboard Error:', error);
        res.status(500).json({
            status: 500,
            message: error.message || "Error retrieving admin dashboard data",
            data: null
        });
    }
};

// Helper function to calculate usage percentage
const calculateUsagePercentage = (current: number, limit: number): number => {
    if (!limit) return 0;
    return Math.min(Math.round((current / limit) * 100), 100);
};

// Helper function to calculate days remaining
const calculateDaysRemaining = (startDate: Date | undefined, endDate: Date | undefined): number => {
    if (!endDate || !startDate) return 0;
    const start = moment(startDate);
    const end = moment(endDate);
    return Math.max(0, end.diff(start, 'days'));
};

// Helper function to calculate growth percentage and trend
const calculateGrowth = (current: number, previous: number, monthName: string): { percentage: number; trend: 'up' | 'down'; monthName: string } => {
    if (previous === 0) {
        return {
            percentage: current > 0 ? 100 : 0,
            trend: current > 0 ? 'up' : 'down',
            monthName
        };
    }
    console.log("current", current);
    console.log("previous", previous);
    console.log("monthName", monthName);
    const growthPercentage = ((current - previous) / previous) * 100;
    return {
        percentage: Math.abs(Math.round(growthPercentage)),
        trend: growthPercentage >= 0 ? 'up' : 'down',
        monthName
    };
};
