import { Request, Response } from 'express';
import stripe from '../lib/stripeConfig';
import User from '../models/userModel';
import Invoice from '../models/invoiceModel';
import Subscription from '../models/subscriptionModel';
import { emitToAdmin, emitSubscriptionEvent, emitToUser } from '../lib/socketConfig';
import Campaign from '../models/campaignModel';

export interface SubscriptionEventPayload {
  type: 'subscription_purchased' | 'subscription_updated' | 'subscription_cancelled';
  subscription: any;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface AdminNotificationPayload {
  event: string;
  userId: string;
  subscription: any;
  timestamp: number;
  sessionDetails?: {
    id: string;
    paymentStatus: string;
    customerEmail?: string;
  };
}

const handleSubscriptionUpdated = async (subscription: any) => {
  try {
    const { customer, status, current_period_start, current_period_end } = subscription;
    
    const user:any = await User.findOne({stripeCustomerId:customer});
    if (!user) throw new Error('User not found');
    
    // Update subscription dates
    user.subscriptionStartDate = new Date(current_period_start * 1000);
    user.subscriptionEndDate = new Date(current_period_end * 1000);
    
    // Update subscription status if needed
    if (status) {
      user.subscriptionStatus = status;
    }
    
    await user.save();

    // Get the subscription from database
    const dbSubscription = await Subscription.findById(user.currentSubscription);
    if (!dbSubscription) {
      throw new Error('Subscription not found in database');
    }

    // Emit subscription updated event with latest dates
    const subscriptionEvent: SubscriptionEventPayload = {
      type: 'subscription_updated',
      subscription: dbSubscription,
      timestamp: Date.now(),
      metadata: {
        customerId: customer,
        renewedAt: new Date(current_period_start * 1000),
        nextBillingDate: new Date(current_period_end * 1000)
      }
    };
    
    await emitSubscriptionEvent(user._id.toString(), subscriptionEvent);
    
    console.log('Subscription updated successfully:', {
      userId: user._id,
      startDate: user.subscriptionStartDate,
      endDate: user.subscriptionEndDate,
      status: user.subscriptionStatus
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

const handleSubscriptionDeleted = async (subscription: any) => {
  const { metadata, customer } = subscription;
  
  // Find user by stripeCustomerId if metadata is not available
  const user:any = subscription.metadata?.userId 
    ? await User.findById(subscription.metadata?.userId)
    : await User.findOne({ stripeCustomerId: customer });
    
  if (!user) throw new Error('User not found');

  // Update user subscription details
  user.subscriptionStatus = 'inactive';
  user.subscriptionEndDate = new Date(); // Set end date to now for immediate cancellation
  user.currentSubscription = null; // Clear the subscription reference
  await user.save();

  // Emit subscription cancelled event
  const subscriptionEvent: SubscriptionEventPayload = {
    type: 'subscription_cancelled',
    subscription: null,
    timestamp: Date.now(),
    metadata: {
      customerId: customer,
      cancelledAt: new Date()
    }
  };
  
  await emitSubscriptionEvent(user._id.toString(), subscriptionEvent);
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
    res.status(500).send('Webhook Error: Missing webhook secret');
    return;
  }

  if (!sig) {
    console.error('Missing stripe-signature header');
    res.status(400).send('Webhook Error: Missing stripe signature');
    return;
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      endpointSecret
    );

    console.log('Received webhook event:', event.type);

    // Get test clock ID from metadata if it exists
    const metadata = (event.data.object as any)?.metadata || {};
    const testClockId = metadata.test_clock_id;
    if (testClockId) {
      console.log('Test clock ID from metadata:', testClockId);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        console.log('§§§subscription when updated', event.data.object);
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        console.log('§§§invoice when payment succeeded', event.data.object);
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
    }

    res.status(200).json({ received: true });
    return;

  } catch (err: any) {
    console.error('Webhook Error:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
};

const handleCheckoutSessionCompleted = async (session: any): Promise<void> => {
  try {
    const { customer, subscription, metadata } = session;
    const { userId, subscriptionId } = metadata;

    // Get the subscription details from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription);
    
    // Find the subscription in our database using the price ID
    const dbSubscription = await Subscription.findById(subscriptionId);

    if (!dbSubscription) {
      throw new Error('Subscription not found in database');
    }

    // Update user with correct subscription ID from our database
    await User.findByIdAndUpdate(userId, {
      stripeCustomerId: customer,
      currentSubscription: dbSubscription._id,
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(stripeSubscription.current_period_end * 1000)
    });
     // Prepare event payload for user notification
     const subscriptionEvent: SubscriptionEventPayload = {
      type: 'subscription_purchased',
      subscription: dbSubscription,
      timestamp: Date.now(),
      metadata: {
        customerId: customer,
        sessionId: session.id
      }
    };

    // Prepare event payload for admin notification
    const adminNotification: AdminNotificationPayload = {
      event: 'new_subscription',
      userId,
      subscription: dbSubscription,
      timestamp: Date.now(),
      sessionDetails: {
        id: session.id,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email
      }
    };

    // Emit events
    await Promise.all([
      emitSubscriptionEvent(userId, subscriptionEvent),
      emitToAdmin('new_subscription', adminNotification)
    ]);

    console.log(`Successfully processed checkout session ${session.id} for user ${userId}`);


  } catch (error) {
    console.error('Error handling checkout session completion:', error);
    // Re-throw the error to be handled by the webhook error handler
    throw new Error(`Checkout session processing failed: ${error}`);
  }
};

async function handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
  try {
    const { customer, subscription, total } = invoice;

    // Get subscription details from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription);
    // Find user and subscription in our database
    const user:any = await User.findOne({ stripeCustomerId: customer });
    let dbSubscription = await Subscription.findOne({ 
      stripePlanId: stripeSubscription.items.data[0].price.id 
    });

    // if in the db the dbSubscription is complete then update the subscription to not complete
    if (dbSubscription && (dbSubscription.isCompleted || dbSubscription.currentCycles !== 0)) {
      dbSubscription.isCompleted = false;
      dbSubscription.completedAt = undefined;
      dbSubscription.currentCycles = 0;
      console.log('when subscription payment succeeded i updated the subscription to not completed and current cycles to 0', dbSubscription);
      await dbSubscription.save();
    }

    if (!user || !dbSubscription) {
      throw new Error('User or subscription not found');
    }

    // Create invoice record
    await Invoice.create({
      userId: user._id,
      subscriptionId: dbSubscription._id,
      stripeSubscriptionId: subscription,
      amount: total / 100,
      status: 'paid',
      startDate: new Date(stripeSubscription.current_period_start * 1000),
      endDate: new Date(stripeSubscription.current_period_end * 1000)
    });

    // Update user's subscription status and dates
    user.subscriptionStatus = 'active'; // Ensure status is active after successful payment
    user.subscriptionStartDate = new Date(stripeSubscription.current_period_start * 1000);
    user.subscriptionEndDate = new Date(stripeSubscription.current_period_end * 1000);
    await user.save();
    console.log('user when payment succeeded', user);

    // update the campaigns in db and emit to user and admin
    const campaigns = await Campaign.find({ userId: user._id });
    for (const campaign of campaigns) {
      if (campaign.status === 'completed') {
        campaign.status = 'approved';
        campaign.approvalStatus.isApproved = true;
      }
      campaign.runCycleCount = 0;
      campaign.hasCompletedCycles = false;
      await campaign.save();
    }

    // Emit subscription updated event with the same dates
    const subscriptionEvent: SubscriptionEventPayload = {
      type: 'subscription_updated',
      subscription: dbSubscription,
      timestamp: Date.now(),
      metadata: {
        customerId: customer,
        renewedAt: new Date(stripeSubscription.current_period_start * 1000),
        nextBillingDate: new Date(stripeSubscription.current_period_end * 1000)
      }
    };
    
    await emitSubscriptionEvent(user._id.toString(), subscriptionEvent);

  } catch (error) {
    console.error('Error handling invoice payment success:', error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice: any): Promise<void> {
  try {
    const { customer, subscription } = invoice;

    const user = await User.findOne({ stripeCustomerId: customer }).populate('currentSubscription');
    if (user) {
      user.subscriptionStatus = 'payment_failed';
      if (user?.currentSubscription) {
        const subscription = await Subscription.findById(user.currentSubscription);
        if (subscription) {
          subscription.isCompleted = true;
          await subscription.save();
        }
      }
      await user.save();
    }


    await Invoice.create({
      userId:user?._id,
      stripeCustomerId: customer,
      stripeSubscriptionId: subscription,
      amount: invoice.total / 100,
      status: 'failed',
      failedAt: new Date()
    });

  } catch (error) {
    console.error('Error handling invoice payment failure:', error);
    throw error;
  }
}
