import Thread from '../models/Thread';
import Message from '../models/Message';
import { NotFoundError } from '../utils/errors';
import { Types } from 'mongoose';
import { emitToAdmin, emitToUser } from '../lib/socketConfig';
import User from '../models/userModel';

export class ChatService {
  async createThread(userId: string, category: string, userStatus: string = "offline") {
    const thread = await Thread.create({
      userId,
      category,
      userStatus
    });
    emitToAdmin('thread_status_update', {
      threadId: thread._id.toString(),
      thread: thread
    });
    return thread;
  }

  async getAdminThreads(page = 1, limit = 20, search = '') {
    const query: any = {};
    if (search) {
      const parts = search.split(' ').filter(Boolean);
      const userQuery: any = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
      if (parts.length >= 2) {
        userQuery.$or.push({
          $and: [
            { firstName: { $regex: parts[0], $options: 'i' } }, 
            { lastName: { $regex: parts[1], $options: 'i' } }
          ]
        });
      }
      const userIds = await User.find(userQuery, '_id').lean();
      query.userId = { $in: userIds.map(u => u._id) };
    }

    return Thread.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('lastMessage')
      .sort({ lastActivity: -1, unreadCount: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  }
 
  async getThreadMessages(threadId: string, page = 1, limit = 50) {
    const messages = await Message.find({ threadId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'firstName lastName email');
    await this.markMessagesAsRead(threadId, true);
    return messages.reverse();
  }

  async sendMessage(threadId: string, userId: string, message: string, isAdmin = false) {
    // Save message to database
    const newMessage = await Message.create({
      threadId,
      sender: userId,
      message,
      isAdmin,
      status: 'delivered'
    });
  
    // Update thread with the real lastMessage
    const updatedThread = await Thread.findByIdAndUpdate(
      threadId,
      { lastMessage: newMessage._id, lastActivity: new Date() },
      { new: true }
    );
  
    return newMessage;
  }

  async markMessagesAsRead(threadId: string, isAdmin: boolean) {
    const thread = await Thread.findById(threadId);
    const messages = await Message.find({ 
      threadId
    });
    if(!messages.length) return;
    if (!thread) throw new NotFoundError('Thread not found');

    // Socket Operation Immediately happens
    if(messages.length > 0){
      if (isAdmin) {
        emitToUser(thread.userId.toString(), 'message_status_update', {
          threadId,
          status: 'read'
        });
      } else {
        emitToAdmin('message_status_update', {
          threadId,
          status: 'read'
        });
      }
      console.log("messages to mark as read have been sent to the socket");
    } else {
      console.log("no messages to mark as read because there are no messages in the thread");
    }

    // database operation will happen after socket operations
    await Message.updateMany(
      { 
        threadId,
        status: { $ne: 'read' }
      },
      { status: 'read' }
    );

    if (isAdmin) {
      thread.unreadCount = 0;
      await thread.save();
    } else {
      console.log("not an admin");
    }
  }

  async createOrGetThread(userId: string, userStatus: string) {
    // Try to find an existing thread
    let thread = await Thread.findOne({ userId })
      .populate('userId', 'firstName lastName email status profileImage')
      .populate('lastMessage');

    // If no thread exists, create a new one
    if (!thread) {
      thread = await this.createThread(userId, 'general', userStatus);
      thread = await Thread.findById(thread._id)
        .populate('userId', 'firstName lastName email status profileImage')
        .populate('lastMessage');
    }

    return thread;
  }
} 