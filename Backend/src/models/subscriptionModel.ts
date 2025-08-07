import mongoose, { Schema, Document } from 'mongoose';
import timestampPlugin from './plugin/timestampPlugin/timeStampPlugin';

export interface ISubscription extends Document {
  planName: string;
  description: string;
  duration: number;
  price: number;
  stripePlanId: string;
  planType?: 'paid' | 'unpaid';
  adCampaignTimeLimit: number;
  adVedioTimeLimit: number;
  campaignLimit: number;
  expiryDate: Date;
  launchDate: Date;
  locationLimit: number;
  priority: number;
  allowedRadius: number;
  runCycleLimit: number;
  currentCycles: number;
  isCompleted: boolean;
  completedAt?: Date;
  isVisible: boolean;
  testClockId?: string;
}

const subscriptionSchema: Schema<ISubscription> = new Schema({
  planName: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  price: { type: Number, required: true },
  stripePlanId: { type: String, required: true },
  planType: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
  adCampaignTimeLimit: { type: Number, required: true },
  adVedioTimeLimit: { type: Number, required: true },
  campaignLimit: { type: Number, required: true },
  locationLimit: { type: Number, required: true },
  priority: { type: Number, required: true },
  allowedRadius: { type: Number, required: true, default: 500 },
  expiryDate: { type: Date, required: true },
  launchDate: { type: Date, required: true },
  runCycleLimit: { type: Number, required: true },
  currentCycles: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  isVisible: { type: Boolean, default: true },
  testClockId: { type: String }
});

subscriptionSchema.plugin(timestampPlugin);

const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);
export default Subscription;
