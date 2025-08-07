import mongoose, { Schema, Document } from 'mongoose';
import timestampPlugin from './plugin/timestampPlugin/timeStampPlugin'; // Adjust path as needed

export interface IInvoice extends Document {
  subscriptionId:mongoose.Types.ObjectId;
  stripeSubscriptionId: string;
  userId:mongoose.Types.ObjectId;
  amount: number;
  status: string;
  startDate: Date;
  endDate: Date;
  paidAt: Date;
  failedAt: Date;
}

const invoiceSchema: Schema<IInvoice> = new Schema({
  
  subscriptionId: {
    type: Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true,
  },
  stripeSubscriptionId: {
    type: String,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Schema.Types.Number,
    required: true,

  },
  status: {
    type: String,
    enum: ['paid', 'failed'],
    required: true,
  },
  startDate: {
    type: Schema.Types.Date,
    required: true,
  },
  endDate: {
    type: Schema.Types.Date,
    required: true,
  },
  paidAt: {
    type: Schema.Types.Date,
  },
  failedAt: {
    type: Schema.Types.Date,
  }
});

invoiceSchema.plugin(timestampPlugin);

const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);

export default Invoice;
