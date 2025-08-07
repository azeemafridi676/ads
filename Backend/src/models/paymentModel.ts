import mongoose, { Schema, Document } from 'mongoose';
import timestampPlugin from './plugin/timestampPlugin/timeStampPlugin';

export enum PaymentType {
  CASH = 'CASH',
  STRIPE = 'STRIPE'
}

export interface IPayment extends Document {
  amount: number;
  paymentType: PaymentType;
  stripePaymentIntentId?: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
}

const paymentSchema: Schema<IPayment> = new Schema({
  amount: { type: Number, required: true },
  paymentType: { type: String, enum: Object.values(PaymentType), required: true },
  stripePaymentIntentId: { type: String },
  status: { type: String, required: true },
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  total: { type: Number, required: true }
});

paymentSchema.plugin(timestampPlugin);

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment;