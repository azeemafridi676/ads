import express from 'express';
import { getAllSubscriptions, getSubscriptionInvoices, createSubscription, createCheckoutSession, updateSubscription, deleteSubscription, toggleSubscriptionVisibility, giftSubscription, advanceTestClock, getCurrentSubscription, getPublicSubscriptions } from '../controllers/subscriptionController';
import { authMiddleware } from '../middleware/authMiddleware';
import { handleWebhook } from '../controllers/webhookController';
const router = express.Router();

router.post(
  '/stripe/webhooks',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

// Public route for getting subscription plans
router.get('/public/plans', getPublicSubscriptions);

router.get('/get-all-plans',authMiddleware, getAllSubscriptions);
router.get('/current-subscription', authMiddleware, getCurrentSubscription);
// router.get('/session-detail/:sessionId',authMiddleware, checkoutSessionDetail);
router.post('/create-plans',authMiddleware, createSubscription);
router.post('/gift-subscription',authMiddleware, giftSubscription);
router.post('/create-checkout-session',authMiddleware, createCheckoutSession);
router.get('/get-invoices',authMiddleware, getSubscriptionInvoices);
router.post('/update-plans',authMiddleware, updateSubscription);
router.delete('/delete-plan/:id',authMiddleware, deleteSubscription);
router.patch('/:id/visibility', authMiddleware, toggleSubscriptionVisibility);

// Test clock route (only available in development)
router.post('/advance-time/:subscriptionId', advanceTestClock);

export default router;
