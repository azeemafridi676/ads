import { Schema, model } from 'mongoose';

const MessageSchema = new Schema({
  threadId: {
    type: Schema.Types.ObjectId,
    ref: 'Thread',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    required: true
  },
  attachments: [{
    type: String,
    url: String,
    name: String,
    size: Number,
    mimeType: String
  }],
  status: {
    type: String,
    enum: [ 'delivered', 'read'],
    default: 'delivered'
  },
  metadata: {
    device: String,
    browser: String,
    ip: String
  }
}, { timestamps: true });

MessageSchema.index({ threadId: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, createdAt: -1 });
MessageSchema.index({ threadId: 1, status: 1 });
MessageSchema.index({ threadId: 1, isAdmin: 1, status: 1 });

export default model('Message', MessageSchema); 