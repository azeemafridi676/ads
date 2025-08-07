import { Request, Response } from 'express';
import Subscription, { ISubscription } from '../models/subscriptionModel';
import { ApiResponse } from '../types/apiResponse';
import stripe from '../lib/stripeConfig';
import Invoice from '../models/invoiceModel';
import UsedSession from '../models/usedSessionsModel';
import mongoose from 'mongoose';
import User from '../models/userModel';
import Stripe from 'stripe';
import Campaign from '../models/campaignModel';
import { emitSubscriptionEvent } from '../lib/socketConfig';
import { SubscriptionEventPayload } from '../controllers/webhookController';

// // Create a new subscription
export const createSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            planName,
            description,
            duration,
            price,
            adCampaignTimeLimit,
            adVedioTimeLimit,
            campaignLimit,
            expiryDate,
            launchDate,
            locationLimit,
            priority,
            allowedRadius,
            runCycleLimit
        } = req.body;

        // Validate required fields
        if (!planName || !description || !duration || !price || !adCampaignTimeLimit || 
            !adVedioTimeLimit || !campaignLimit || !expiryDate || !launchDate || !allowedRadius ||
            !locationLimit || priority === undefined || !runCycleLimit) {
            const response: ApiResponse<null> = {
                status: 400,
                message: 'All fields are required',
            };
            res.status(400).json(response);
            return;
        }

        let testClock;
        // Automatically create test clock in development
        if (process.env.NODE_ENV === 'development') {
            testClock = await stripe.testHelpers.testClocks.create({
                frozen_time: Math.floor(Date.now() / 1000),
                name: `Clock for ${planName}`
            });
        }

        // Create product in Stripe
        const product = await stripe.products.create({
            name: planName,
            description,
            metadata: {
                adCampaignTimeLimit,
                adVedioTimeLimit,
                campaignLimit,
                locationLimit,
                priority,
                allowedRadius,
                runCycleLimit,
                test_clock: testClock?.id // Add test clock ID to metadata
            }
        });

        // Create price
        const priceOptions = {
            unit_amount: price * 100,
            currency: 'usd',
            recurring: { 
                interval: (process.env.NODE_ENV === 'development' ? 'day' : 'month') as 'day' | 'month',
                interval_count: process.env.NODE_ENV === 'development' ? 1 : duration
            },
            product: product.id,
            metadata: {
                duration,
                expiryDate,
                launchDate,
                test_clock: testClock?.id // Add test clock ID to metadata
            }
        };

        const stripePlan = await stripe.prices.create(priceOptions);

        if (!stripePlan.id) {
            const response: ApiResponse<null> = {
                status: 500,
                message: 'Failed to create subscription in Stripe',
            };
            res.status(500).json(response);
            return;
        }

        // Create subscription in database
        const newSubscription = new Subscription({
            planName,
            description,
            duration,
            price,
            stripePlanId: stripePlan.id,
            planType: price > 0 ? 'paid' : 'unpaid',
            adCampaignTimeLimit,
            adVedioTimeLimit,
            campaignLimit,
            expiryDate,
            launchDate,
            locationLimit,
            priority,
            allowedRadius,
            runCycleLimit,
            isCompleted: false,
            completedAt: null,
            testClockId: testClock?.id // Store test clock ID if created
        });

        const subscription = await newSubscription.save();

        const response: ApiResponse<any> = {
            status: 201,
            data: {
                ...subscription.toObject(),
                testClockId: testClock?.id // Include test clock ID in response
            },
            message: 'Subscription created successfully',
        };
        res.status(201).json(response);

    } catch (error) {
        console.error('Error creating subscription:', error);
        const response: ApiResponse<null> = {
            status: 500,
            message: 'Internal server error',
        };
        res.status(500).json(response);
    }
};

// Modify getAllSubscriptions to handle visibility filtering
export const getAllSubscriptions = async (req: Request, res: Response): Promise<void> => {
    try {
        const isAdmin = (req as any).user?.role === 'admin';
        // If admin, get all subscriptions, otherwise only visible ones
        const query = isAdmin ? {} : { isVisible: true };
        
        // Get subscriptions sorted by creation date (newest first)
        const subscriptions = await Subscription.find(query).sort({ createdAt: -1 });
        
        // Process each subscription to check if it's in use
        const subscriptionsWithStatus = await Promise.all(subscriptions.map(async (subscription: ISubscription) => {
            const usersWithSubscription = await User.find({ 
                currentSubscription: subscription._id,
                subscriptionStatus: 'active'
            });

            return {
                ...subscription.toObject(),
                isInUse: usersWithSubscription.length > 0
            };
        }));

        const response: ApiResponse<any> = {
            status: 200,
            data: subscriptionsWithStatus,
            message: 'Subscriptions fetched successfully',
        };
        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        const response: ApiResponse<null> = {
            status: 500,
            message: 'Internal server Error',
        };
        res.status(500).json(response);
    }
};

// // Get all invoices
export const getSubscriptionInvoices = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user._id;
  
      const invoicesWithDetails = await Invoice.aggregate([
        {
          $match: {
              userId: new mongoose.Types.ObjectId(userId) 
          }
        },
        {
          $lookup: {
            from: 'users', 
            localField: 'userId',
            foreignField: '_id',
            as: 'userDetails'
          }
        },
        {
          $unwind: {
            path: '$userDetails',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'subscriptions', 
            localField: 'subscriptionId',
            foreignField: '_id',
            as: 'subscriptionDetails'
          }
        },
        {
          $unwind: {
            path: '$subscriptionDetails',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            userDetails: 1,
            subscriptionDetails: 1,
            stripeSubscriptionId: 1,
            amount: 1,
            status: 1,
            startDate: 1,
            endDate: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      ]);
  
      const response: ApiResponse<any> = {
        status: 200,
        data: invoicesWithDetails,
        message: 'Invoices fetched successfully',
      };
  
      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching invoices:', error);
  
      const response: ApiResponse<null> = {
        status: 500,
        message: 'Internal server error',
      };
  
      res.status(500).json(response);
    }
  };
// // Get a single subscription by ID
// export const getSubscriptionById = async (req: Request, res: Response): Promise<void> => {
//     try {
//         const { id } = req.params;
//         const subscription = await Subscription.findById(id);
//         if (subscription) {
//             const response: ApiResponse<any> = {
//                 status: 200,
//                 data: subscription,
//                 message: 'Subscription fetched successfully',
//             };
//             res.status(200).json(response);
//         } else {
//             const response: ApiResponse<null> = {
//                 status: 404,
//                 message: 'Subscription not found',
//             };
//             res.status(404).json(response);
//         }
//     } catch (error) {
//         const response: ApiResponse<null> = {
//             status: 500,
//             message: 'Internal server Error',
//         };
//         res.status(500).json(response);
//     }
// };

// Update a subscription by ID
export const updateSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const { _id, planName, description, duration, price, adCampaignTimeLimit, adVedioTimeLimit, campaignLimit, expiryDate, launchDate, locationLimit, priority, allowedRadius, runCycleLimit } = req.body;

        // Check if all required fields are present
        if (!_id || !planName || !description || !duration || !price || !adCampaignTimeLimit || 
            !adVedioTimeLimit || !campaignLimit || !expiryDate || !launchDate || !locationLimit || 
            priority === undefined || !allowedRadius || !runCycleLimit) {
            const response: ApiResponse<null> = {
                status: 400,
                message: 'All fields are required',
            };
            res.status(400).json(response);
            return;
        }

        // Check if subscription is being used by any user
        const usersWithSubscription = await User.find({ currentSubscription: _id });
        if (usersWithSubscription.length > 0) {
            const response: ApiResponse<null> = {
                status: 400,
                message: 'Cannot update subscription as it is currently in use by users',
            };
            res.status(400).json(response);
            return;
        }

        // Find the existing subscription
        const existingSubscription = await Subscription.findById(_id);
        if (!existingSubscription) {
            const response: ApiResponse<null> = {
                status: 404,
                message: 'Subscription not found',
            };
            res.status(404).json(response);
            return;
        }

        // First retrieve the price to get the product ID
        const existingPrice = await stripe.prices.retrieve(existingSubscription.stripePlanId);
        if (!existingPrice.product) {
            const response: ApiResponse<null> = {
                status: 404,
                message: 'Associated Stripe product not found',
            };
            res.status(404).json(response);
            return;
        }

        // Update product in Stripe using the correct product ID
        const product = await stripe.products.update(existingPrice.product as string, {
            name: planName,
            description,
            metadata: {
                adCampaignTimeLimit,
                adVedioTimeLimit,
                campaignLimit,
                locationLimit,
                priority,
                allowedRadius,
                runCycleLimit
            }
        });

        // Create new price in Stripe (prices cannot be updated, only created)
        const stripePlan = await stripe.prices.create({
            unit_amount: price * 100,
            currency: 'usd',
            recurring: { 
                interval: process.env.NODE_ENV === 'development' ? 'day' : 'month', // Use days in development
                interval_count: process.env.NODE_ENV === 'development' ? 1 : duration // 1 day in development, otherwise use specified duration
            },
            product: product.id,
            metadata: {
                duration,
                expiryDate,
                launchDate
            }
        });

        // Update subscription in database
        const subscription = await Subscription.findByIdAndUpdate(
            _id,
            {
                planName,
                description,
                duration,
                price,
                stripePlanId: stripePlan.id,
                adCampaignTimeLimit,
                adVedioTimeLimit,
                campaignLimit,
                expiryDate,
                launchDate,
                locationLimit,
                priority,
                allowedRadius,
                runCycleLimit
            },
            { new: true }
        );

        if (subscription) {
            const response: ApiResponse<any> = {
                status: 200,
                data: subscription,
                message: 'Subscription updated successfully',
            };
            res.status(200).json(response);
        } else {
            const response: ApiResponse<null> = {
                status: 404,
                message: 'Subscription not found',
            };
            res.status(404).json(response);
        }
    } catch (error) {
        console.error('Error updating subscription:', error);
        const response: ApiResponse<null> = {
            status: 500,
            message: 'Internal server error',
        };
        res.status(500).json(response);
    }
};

// Delete a subscription by ID
export const deleteSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Check if subscription is being used by any user
        const usersWithSubscription = await User.find({ currentSubscription: id });
        if (usersWithSubscription.length > 0) {
            const response: ApiResponse<null> = {
                status: 400,
                message: 'Cannot delete subscription as it is currently in use by users',
            };
            res.status(400).json(response);
            return;
        }

        // Find the subscription to get Stripe price ID
        const subscription = await Subscription.findById(id);
        if (!subscription) {
            const response: ApiResponse<null> = {
                status: 404,
                message: 'Subscription not found',
            };
            res.status(404).json(response);
            return;
        }

        // First retrieve the price to get the product ID
        const price = await stripe.prices.retrieve(subscription.stripePlanId);
        if (!price.product) {
            const response: ApiResponse<null> = {
                status: 404,
                message: 'Associated Stripe product not found',
            };
            res.status(404).json(response);
            return;
        }

        // Now archive the product in Stripe using the product ID from the price
        await stripe.products.update(price.product as string, {
            active: false
        });

        // Delete the subscription from database
        await Subscription.findByIdAndDelete(id);

        const response: ApiResponse<any> = {
            status: 200,
            message: 'Subscription deleted successfully',
        };
        res.status(200).json(response);

    } catch (error) {
        console.error('Error deleting subscription:', error);
        const response: ApiResponse<null> = {
            status: 500,
            message: 'Internal server Error',
        };
        res.status(500).json(response);
    }
};

export const checkoutSessionDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    // Check if session exists and hasn't been used
    const usedSession = await UsedSession.findOne({ sessionId });
    if (usedSession) {
      const response: ApiResponse<null> = {
        status: 400,
        message: 'This checkout session has already been used',
      };
      res.status(400).json(response);
      return;
    }

    // Retrieve and verify session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    });

    if (session.payment_status !== 'paid') {
      const response: ApiResponse<null> = {
        status: 400,
        message: 'Payment not completed',
      };
      res.status(400).json(response);
      return;
    }

    if (session.status !== 'complete') {
      const response: ApiResponse<null> = {
        status: 400,
        message: 'Checkout session not completed',
      };
      res.status(400).json(response);
      return;
    }

    // Mark session as used
    await UsedSession.create({
      sessionId,
      userId: session?.metadata?.userId,
      usedAt: new Date()
    });

    const response: ApiResponse<any> = {
      status: 200,
      message: 'Subscription activated successfully',
      data: {
        subscriptionId: session.subscription,
        customerId: session.customer
      }
    };
    res.status(200).json(response);

  } catch (error) {
    console.error('Error in checkoutSessionDetail:', error);
    const response: ApiResponse<null> = {
      status: 500,
      message: 'Internal server error',
    };
    res.status(500).json(response);
  }
};


// // Activate User Subscriptions
// export const activateUserSubscription = async ({
//     userId,
//     subscriptionId,
//     customer,
//     stripeSubscriptionId
// }: {
//     restaurantId: string;
//     subscriptionId: string;
//     customer: string;
//     stripeSubscriptionId: string;
// }): Promise<{ status: number; message: string; data?: any }> => {
//     try {
//         const restaurant: any = await Restaurant.findById(restaurantId);

//         if (!restaurant) {
//             return {
//                 status: 404,
//                 message: 'Restaurant not found',
//             };
//         }
//         const subscription = await Subscription.findOne({ stripePlanId: subscriptionId });
//         if (!subscription) {
//             return {
//                 status: 404,
//                 message: 'Subscription plan not found',
//             };
//         }
//         restaurant.stripeCustomerId = customer;
//         await restaurant.save();
//         const stripeSubscription: any = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
//             expand: ['default_payment_method'],
//         });
//         const paymentMethodId = stripeSubscription?.default_payment_method?.id || '';

//         if (!paymentMethodId) {
//             return {
//                 status: 400,
//                 message: 'No payment method found for the subscription.',
//             };
//         }
//         await stripe.paymentMethods.attach(paymentMethodId, {
//             customer: restaurant.stripeCustomerId,
//         });
//         await stripe.customers.update(restaurant.stripeCustomerId, {
//             invoice_settings: { default_payment_method: paymentMethodId },
//         });
//         restaurant.currentSubscription = subscription._id;
//         restaurant.subscriptionStartDate = new Date();
//         restaurant.subscriptionEndDate = new Date(Date.now() + subscription.duration * 30 * 24 * 60 * 60 * 1000);
//         restaurant.subscriptionStatus = 'active';
//         await restaurant.save();
//         await Invoice.updateMany(
//             { userId: new mongoose.Types.ObjectId(userId), status: 'active' },
//             { $set: { status: 'inactive' } }
//           );
//         await Invoice.create({
//             userId: userId,
//             subscriptionId: subscription._id,
//             stripeSubscriptionId: stripeSubscriptionId,
//             amount: subscription.price,
//             status: 'active',
//             startDate: restaurant.subscriptionStartDate,
//             endDate: restaurant.subscriptionEndDate,
//         });

//         return {
//             status: 201,
//             message: 'Subscription activated successfully',
//             data: restaurant,
//         };

//     } catch (error: any) {
//         console.error('Error activating subscription:', error?.message || error);
//         return {
//             status: 500,
//             message: error?.message || 'Internal server error',
//         };
//     }
// };

export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
    const { planId } = req.body;
    const user = (req as any).user;
    try {
        // Find the subscription by stripePlanId
        const plan = await Subscription.findOne({ stripePlanId: planId });
        if (!plan) {
            console.log('Subscription plan not found');
            const response: ApiResponse<null> = {
                status: 404,
                message: 'Subscription plan not found',
            };
            res.status(404).json(response);
            return;
        }

        // Verify if the price exists in the current Stripe account
        try {
            await stripe.prices.retrieve(plan.stripePlanId);
        } catch (stripeError) {
            console.log('This subscription plan is not available in the current Stripe account. Please contact support.');
            const response: ApiResponse<null> = {
                status: 400,
                message: 'This subscription plan is not available in the current Stripe account. Please contact support.',
            };
            res.status(400).json(response);
            return;
        }

        // Create a customer with the Test Clock in development
        let customer;
        if (process.env.NODE_ENV === 'development' && plan.testClockId) {
            customer = await stripe.customers.create({
                email: user.email,
                test_clock: plan.testClockId, // Attach Test Clock to customer
                metadata: {
                    userId: user._id.toString(),
                    test_clock_id: plan.testClockId
                }
            });
        } else {
            customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    userId: user._id.toString()
                }
            });
        }

        // Create base session options
        const baseSessionOptions: Stripe.Checkout.SessionCreateParams = {
            payment_method_types: ['card'],
            line_items: [{
                price: plan.stripePlanId,
                quantity: 1,
            }],
            customer: customer.id, // Use the customer with Test Clock
            metadata: {
                userId: user._id.toString(),
                subscriptionId: plan._id?.toString() || '',
                test_clock_id: plan.testClockId || ''
            },
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL}/dashboard/subscriptions/{CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/dashboard/subscriptions`,
        };

        // Create the session
        const session = await stripe.checkout.sessions.create(baseSessionOptions);
        console.log('Checkout session Created Successfully');
        const response: ApiResponse<any> = {
            status: 201,
            data: session,
            message: 'Checkout session Created Successfully',
        };
        res.status(201).json(response);

    } catch (error:any) {
        console.error('Error creating checkout session:', error?.response?.data);
        const response: ApiResponse<null> = {
            status: 500,
            message: 'Internal server error',
        };
        res.status(500).json(response);
    }
};

// export const getSubscriptionStatus = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const userId = (req as any).user._id;
//     const user = await User.findById(userId).populate('currentSubscription');

//     if (!user) {
//       const response: ApiResponse<null> = {
//         status: 404,
//         message: 'User not found',
//       };
//       res.status(404).json(response);
//       return;
//     }

//     const invoices = await Invoice.find({ 
//       userId: user._id 
//     }).sort({ createdAt: -1 });

//     const response: ApiResponse<any> = {
//       status: 200,
//       data: {
//         currentSubscription: user.currentSubscription,
//         subscriptionStatus: user.subscriptionStatus,
//         subscriptionStartDate: user.subscriptionStartDate,
//         subscriptionEndDate: user.subscriptionEndDate,
//         paymentHistory: invoices
//       },
//       message: 'Subscription status retrieved successfully',
//     };
//     res.status(200).json(response);

//   } catch (error) {
//     console.error('Error getting subscription status:', error);
//     const response: ApiResponse<null> = {
//       status: 500,
//       message: 'Internal server error',
//     };
//     res.status(500).json(response);
//   }
// };

// Add new method to toggle subscription visibility
export const toggleSubscriptionVisibility = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const subscription = await Subscription.findById(id);

        if (!subscription) {
            const response: ApiResponse<null> = {
                status: 404,
                message: 'Subscription not found',
            };
            res.status(404).json(response);
            return;
        }

        // Toggle the visibility
        subscription.isVisible = !subscription.isVisible;
        await subscription.save();

        const response: ApiResponse<any> = {
            status: 200,
            data: subscription,
            message: `Subscription ${subscription.isVisible ? 'shown' : 'hidden'} successfully`,
        };
        res.status(200).json(response);

    } catch (error) {
        console.error('Error toggling subscription visibility:', error);
        const response: ApiResponse<null> = {
            status: 500,
            message: 'Internal server error',
        };
        res.status(500).json(response);
    }
};

// Gift a subscription to a user
export const giftSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, subscriptionId } = req.body;
        const adminUser = (req as any).user;

        // Verify admin role
        if (adminUser.role !== 'admin') {
            const response: ApiResponse<null> = {
                status: 403,
                message: 'Only admins can gift subscriptions',
            };
            res.status(403).json(response);
            return;
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            const response: ApiResponse<null> = {
                status: 404,
                message: 'User not found',
            };
            res.status(404).json(response);
            return;
        }

        // Find the subscription
        const subscription = await Subscription.findById(subscriptionId);
        if (!subscription) {
            const response: ApiResponse<null> = {
                status: 404,
                message: 'Subscription not found',
            };
            res.status(404).json(response);
            return;
        }

        // Calculate subscription dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + subscription.duration);

        // Update subscription status if it was completed
        if (subscription.isCompleted || subscription.currentCycles !== 0) {
            subscription.isCompleted = false;
            subscription.completedAt = undefined;
            subscription.currentCycles = 0;
            await subscription.save();
        }

        // Update user's subscription with gift details
        const updateData = {
            currentSubscription: subscription._id,
            subscriptionStatus: 'active',
            subscriptionStartDate: startDate,
            subscriptionEndDate: endDate,
            isGiftedSubscription: true,
            giftedBy: adminUser._id,
            giftedAt: startDate
        };

        // Update user with gift subscription details
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).populate('currentSubscription');

        if (!updatedUser) {
            const response: ApiResponse<null> = {
                status: 500,
                message: 'Failed to update user subscription',
            };
            res.status(500).json(response);
            return;
        }

        // Update campaigns similar to handleInvoicePaymentSucceeded
        const campaigns = await Campaign.find({ userId: (user as any)._id });
        for (const campaign of campaigns) {
            if (campaign.status === 'completed') {
                campaign.status = 'approved';
                campaign.approvalStatus.isApproved = true;
            }
            campaign.runCycleCount = 0;
            campaign.hasCompletedCycles = false;
            await campaign.save();
        }

        // Emit subscription event similar to handleInvoicePaymentSucceeded
        const subscriptionEvent: SubscriptionEventPayload = {
            type: 'subscription_updated',
            subscription: subscription,
            timestamp: Date.now(),
            metadata: {
                customerId: (user as any).stripeCustomerId,
                renewedAt: startDate,
                nextBillingDate: endDate
            }
        };
        
        await emitSubscriptionEvent((user as any)._id.toString(), subscriptionEvent);

        const response: ApiResponse<any> = {
            status: 200,
            data: {
                user: updatedUser,
                subscription,
                startDate,
                endDate
            },
            message: 'Subscription gifted successfully',
        };
        res.status(200).json(response);

    } catch (error) {
        console.error('Error gifting subscription:', error);
        const response: ApiResponse<null> = {
            status: 500,
            message: 'Internal server error',
        };
        res.status(500).json(response);
    }
};

// Advance test clock
export const advanceTestClock = async (req: Request, res: Response): Promise<void> => {
    try {
        const { subscriptionId } = req.params;

        // check if it is development or production
        if (process.env.NODE_ENV !== 'development') {
            const response: ApiResponse<null> = {
                status: 400,
                message: 'Test clock is not available in production mode',
            };
            res.status(400).json(response);
            return;
        }
        
        // Find the subscription to get the test clock ID
        const subscription = await Subscription.findById(subscriptionId);
        if (!subscription || !subscription.testClockId) {
            const response: ApiResponse<null> = {
                status: 404,
                message: 'Subscription not found or no test clock associated',
            };
            res.status(404).json(response);
            return;
        }

        // Get the current state of the Test Clock
        const testClock = await stripe.testHelpers.testClocks.retrieve(subscription.testClockId);
        const currentFrozenTime = testClock.frozen_time;

        // Advance clock by 25 hours (90000 seconds) from its current time
        const advancedClock = await stripe.testHelpers.testClocks.advance(
            subscription.testClockId,
            { frozen_time: currentFrozenTime + 90000 }
        );

        const response: ApiResponse<any> = {
            status: 200,
            data: advancedClock,
            message: 'Test clock advanced successfully',
        };
        res.status(200).json(response);

    } catch (error) {
        console.error('Error advancing test clock:', error);
        const response: ApiResponse<null> = {
            status: 500,
            message: 'Internal server error',
        };
        res.status(500).json(response);
    }
};

export const getCurrentSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        const user = await User.findById(userId).populate('currentSubscription');

        if (!user) {
            const response: ApiResponse<null> = {
                status: 404,
                message: 'User not found',
            };
            res.status(404).json(response);
            return;
        }

        const response: ApiResponse<any> = {
            status: 200,
            data: {
                currentSubscription: user.currentSubscription,
                subscriptionStatus: user.subscriptionStatus,
                subscriptionStartDate: user.subscriptionStartDate,
                subscriptionEndDate: user.subscriptionEndDate,
                isGiftedSubscription: user.isGiftedSubscription,
                giftedBy: user.giftedBy,
                giftedAt: user.giftedAt
            },
            message: 'Current subscription retrieved successfully',
        };
        res.status(200).json(response);

    } catch (error) {
        console.error('Error getting current subscription:', error);
        const response: ApiResponse<null> = {
            status: 500,
            message: 'Internal server error',
        };
        res.status(500).json(response);
    }
};

// Get public subscription plans
export const getPublicSubscriptions = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 6;
        const skip = (page - 1) * limit;

        // Get total count of visible subscriptions
        const total = await Subscription.countDocuments({ isVisible: true });

        // Get paginated subscriptions
        const subscriptions = await Subscription.find({ isVisible: true })
            .select({
                planName: 1,
                description: 1,
                duration: 1,
                price: 1,
                adCampaignTimeLimit: 1,
                adVedioTimeLimit: 1,
                campaignLimit: 1,
                locationLimit: 1,
                priority: 1,
                allowedRadius: 1,
                runCycleLimit: 1,
                _id: 1
            })
            .sort({ price: 1 })
            .skip(skip)
            .limit(limit);

        const response: ApiResponse<any> = {
            status: 200,
            data: {
                subscriptions,
                total,
                page,
                limit
            },
            message: 'Public subscription plans fetched successfully',
        };
        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching public subscriptions:', error);
        const response: ApiResponse<null> = {
            status: 500,
            message: 'Internal server error',
        };
        res.status(500).json(response);
    }
};

