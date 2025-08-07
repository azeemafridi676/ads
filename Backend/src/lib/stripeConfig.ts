import Stripe from 'stripe';
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'your-stripe-secret-key';

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export default stripe;
