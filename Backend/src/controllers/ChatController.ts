import { Request, Response } from 'express';
import { ChatService } from '../services/ChatService';
import Thread from '../models/Thread';
import Message from '../models/Message';
import User from '../models/userModel';
import { sendNewChatMessageToAdmin, sendNewChatMessageToUser } from '../services/emailService';
import { emitToAdmin, emitToUser } from '../lib/socketConfig';

const chatService = new ChatService();
export const getAdminThreads = async (req: Request, res: Response): Promise<void> => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const threads = await chatService.getAdminThreads(
            Number(page),
            Number(limit),
            search.toString()
        );

        res.status(200).json({
            status: 200,
            message: "Threads retrieved successfully",
            data: threads
        });
    } catch (error: any) {
        res.status(500).json({
            status: 500,
            message: error.message || "Failed to fetch threads",
            data: null
        });
    }
};

export const getMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        const threadId = await Thread.findOne({ userId });

        const isAdmin = (req as any).user.role === 'admin';
        if(!threadId) {
            res.status(200).json({
                status: 200,
                message: "No thread found",
                data: null
            });
            return;
        };
        const messages = await Message.find({ threadId: threadId?._id }).sort({ createdAt: 1 });
        await chatService.markMessagesAsRead(threadId?._id.toString(), isAdmin);

        res.status(200).json({
            status: 200,
            message: "Messages retrieved successfully",
            data: messages
        });
    } catch (error: any) {
        console.log('error', error);
        res.status(500).json({
            status: 500,
            message: error.message || "Failed to fetch messages",
            data: null
        });
    }
};
export const getAdminMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { page, limit, threadId } = req.query; 
        if (!threadId) throw new Error('Thread ID is required');
        const messages = await chatService.getThreadMessages(
            threadId.toString(),
            Number(page),
            Number(limit)
        );

        res.status(200).json({
            status: 200,
            message: "Messages retrieved successfully",
            data: messages
        });
    } catch (error: any) {
        res.status(500).json({
            status: 500,
            message: error.message || "Failed to fetch messages",
            data: null
        });
    }
};
export const sendMessageToAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { message, threadId } = req.body;
        const userId = (req as any).user._id;
        const isAdmin = (req as any).user.role === 'admin';
        let activeThread = await findOrCreateThread(threadId, userId, "online");
    
        const newMessage = {
            threadId: activeThread?._id.toString(),
            sender: userId,
            message,
            unreadCount: activeThread?.unreadCount + 1 || 0,
            isAdmin,
            status: 'sent',
            createdAt: new Date(),
            updatedAt: new Date()        
        };
    
    
        let savedMessage;
        if (!isAdmin) {
            // Step 1: Emit socket event first (your requirement)
            emitToAdmin('new_message_recieved_from_user', { threadId: activeThread?._id.toString(), message: newMessage });
    
            // Step 2: Fast update to thread (unreadCount and lastActivity)
            await Thread.findByIdAndUpdate(
            activeThread._id,
            {
                unreadCount: activeThread.unreadCount + 1,
                lastActivity: new Date(),
                // Optionally set a temp lastMessage if needed, but we'll update it later
            },
            { new: true }
            );
    
            // Step 3: Save the full message and update thread with real lastMessage
            savedMessage = await chatService.sendMessage(activeThread?._id.toString(), userId, message, isAdmin);
        }
    
        res.status(200).json({ status: 200, message: "Message sent successfully", data: savedMessage });
        } catch (error: any) {
        res.status(500).json({ status: 500, message: error.message || "Failed to send message", data: null });
        }
};
export const sendMessageToUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { message, threadId } = req.body;
        const userId = (req as any).user._id;
        const thread = await Thread.findById(threadId)
        if (!thread) throw new Error('Thread not found');

        const newMessage = {
            threadId,
            sender: userId,
            message,
            isAdmin: true,
            status: 'sent',
            createdAt: new Date(),
            updatedAt: new Date()
        }

        console.log("New Message to User", newMessage);

        // Emit socket event after successful save
        emitToUser(thread.userId.toString(), 'new_message_recieved_from_admin', newMessage);
        
        const userDetails = await User.findById(thread?.userId);

        // save in db
        const savedMessage = await chatService.sendMessage(
            thread?._id.toString(),
            userId,
            message,
            true
        );


        if(userDetails && userDetails.status === 'offline'){
            await sendNewChatMessageToUser({email: userDetails.email, userName: userDetails.firstName + ' ' + userDetails.lastName, messagePreview: message});
        }

        res.status(200).json({
            status: 200,
            message: "Message sent successfully",
            data: savedMessage
        });
    } catch (error: any) {
        res.status(500).json({
            status: 500,
            message: error.message || "Failed to send message",
            data: null
        });
    }
};
const findOrCreateThread = async (threadId: string | null, userId: string, userStatus?:string) => {
    if (!threadId) {
        const existingThread = await Thread.findOne({ userId }).sort({ createdAt: -1 });
        if (existingThread) {
            return existingThread;
        }
        const newThread = await chatService.createThread(userId, 'general', userStatus);
        return newThread;
    }
    const thread = await Thread.findById(threadId);
    if (!thread) {
        const newThread = await chatService.createThread(userId, 'general', userStatus);
        return newThread;
    }
    return thread;
};

export const markMessagesAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const { threadId } = req.body;
        const isAdmin = (req as any).user.role === 'admin';

        await chatService.markMessagesAsRead(threadId, isAdmin);

        res.status(200).json({
            status: 200,
            message: "Messages marked as read",
            data: null
        });
    } catch (error: any) {
        res.status(500).json({
            status: 500,
            message: error.message || "Failed to mark messages as read",
            data: null
        });
    }
};

export const createOrGetChatThread = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.body;

        if ((req as any).user.role !== 'admin') {
            res.status(403).json({
                status: 403,
                message: "Only admins can create chat threads",
                data: null
            });
            return;
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                status: 404,
                message: "User not found",
                data: null
            });
            return;
        }
        // Find existing thread or create new one
        const thread = await chatService.createOrGetThread(userId, user?.status);

        res.status(200).json({
            status: 200,
            message: "Chat thread created/retrieved successfully",
            data: thread
        });
    } catch (error: any) {
        res.status(500).json({
            status: 500,
            message: error.message || "Failed to create/get chat thread",
            data: null
        });
    }
};

export const getThreadById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { threadId } = req.params;
        
        if ((req as any).user.role !== 'admin') {
            res.status(403).json({
                status: 403,
                message: "Only admins can access thread details",
                data: null
            });
            return;
        }
        // for testing console all the threads
        const threads = await Thread.find();
        const thread = await Thread.findById(threadId)
            .populate('userId', 'firstName lastName email status profileImage')
            .populate('lastMessage');

        if (!thread) {
            res.status(404).json({
                status: 404,
                message: "Thread not found",
                data: null
            });
            return;
        }
        res.status(200).json({
            status: 200,
            message: "Thread retrieved successfully",
            data: thread
        });
    } catch (error: any) {
        res.status(500).json({
            status: 500,
            message: error.message || "Failed to get thread",
            data: null
        });
    }
};
