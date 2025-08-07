import { Schema, model } from 'mongoose';

const ThreadSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  userStatus: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'campaign', 'general'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

ThreadSchema.index({ userId: 1, createdAt: -1 });
ThreadSchema.index({ lastActivity: -1, unreadCount: -1 });
ThreadSchema.index({ category: 1, lastActivity: -1 });
ThreadSchema.index({ userStatus: 1 });

export default model('Thread', ThreadSchema); 
