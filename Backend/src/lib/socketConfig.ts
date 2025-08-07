import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';
import Thread from '../models/Thread';
import Notification from '../models/Notification';

export let io: Server;

export const initializeSocket = (httpServer: HttpServer) => {
  const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:4200', 'http://localhost:55302'];
  if (!allowedOrigins.includes('http://localhost:4200')) {
    allowedOrigins.push('http://localhost:4200');
  }

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Authorization', 'Content-Type']
    },
    allowEIO3: true,
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware with better error handling
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        // console.error('Authentication failed: No token provided');
        return next(new Error('Authentication token is required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        // console.error('Authentication failed: User not found');
        return next(new Error('User not found'));
      }

      (socket as any).user = user;
      next();
    } catch (error:any) {
      // console.error('Socket authentication error:', error?.response?.data);
      next(new Error('Authentication failed: ' + (error as Error).message));
    }
  });

  // Add error handling for the io server
  io.engine.on('connection_error', (err: any) => {
    // console.error('Socket.io connection error:', err);
  });

  io.on('connect_error', (err) => {
    // console.error('Socket.io connect_error:', err);
  });

  io.on('connection', async (socket) => {
    const userId = (socket as any).user._id;
    if ((socket as any).user.role === 'admin') {
      socket.join('admin_room');
    } else {
      socket.join('users');
    }

    socket.join(`user_${userId}`);
      
    
    markUserStatus((socket as any).user, 'online');
    await User.findByIdAndUpdate((socket as any).user._id, {status: 'online'});
    
    // Set up periodic test message emission
    const testInterval = setInterval(() => {
      socket.emit('testing the socket', { 
        message: 'Test message from server', 
        timestamp: new Date().toISOString() 
      });
    }, 3000);

    socket.on('disconnect', async () => {
      clearInterval(testInterval); // Clean up the interval when socket disconnects
      markUserStatus((socket as any).user, 'offline');
      await User.findByIdAndUpdate((socket as any).user._id, {status: 'offline'});
    });
    socket.on('private_message', async (data) => {
      const { recipientId, message } = data;
      io.to(`user_${recipientId}`).emit('private_message', {
        senderId: (socket as any).user._id,
        message
      });
    });

    // Handle read notifications
    socket.on('mark_notifications_read', async (notificationIds: string[]) => {
      await Notification.updateMany(
        { _id: { $in: notificationIds } },
        { read: true, readAt: new Date() }
      );
    });
  });

  return io;
};

export const disconnectSocket = async (userId: string) => {
  try {
    io?.to(`user_${userId}`).disconnectSockets();
    console.log('Socket disconnected for user:', userId);
  } catch (error:any) {
    // console.error('Error disconnecting socket:', error?.response?.data);
  }
};

// Notification emitters
export const emitNotification = async (userId: string, notification: any) => {
  console.log('Emitting notification to user:', userId);
  // Just emit the notification to the socket without creating a new one
  io?.to(`user_${userId}`).emit('notification', notification);
};

export const emitAdminNotification = async (notification: any) => {
  // Save notification for all admins
  const admins = await User.find({ role: 'admin' });
  
  const notifications = await Promise.all(
    admins.map(admin => 
      Notification.create({
        recipient: admin._id,
        ...notification
      })
    )
  );
  // Emit to admin room
  io?.to('admin_room').emit('notification', notifications[0]);
};

export const emitSubscriptionEvent = (userId: string, eventData: any) => {
  console.log('Emitting subscription event to user:', userId);
  io?.to(`user_${userId}`).emit('subscription_event', eventData);
};

export const emitToAdmin = (eventName: string, data: any) => {
  io?.to('admin_room').emit(eventName, data);
};

export const emitToUser = (userId: string, eventName: string, data: any) => {
 
    
    const socket = io?.to(`user_${userId}`);
    if (!socket) {
        // console.error("❌ [Socket Config] Socket instance not found");
        return;
    }
    
    socket.emit(eventName, data);
};

export const emitToAllUsers = (eventName: string, data: any) => {
  const socket = io?.to('users');
  if (!socket) {
    // console.error("❌ [Socket Config] Socket instance not found");
    return;
  }
  socket.emit(eventName, data);
};

// Campaign event emitters for drivers
export const emitCampaignCreated = async (campaign: any) => {
  try {
    
    // Broadcast to all authenticated users
    io?.emit('campaign_created', {
      type: 'created',
      campaign: campaign
    });

  } catch (error) {
    // console.error('Error broadcasting campaign:', error);
  }
};

export const markUserStatus = async (user: any, status: 'online' | 'offline') => {
  if (user.role === 'admin') {
    emitToAllUsers('admin_status_changed', {
      adminId: user._id,
      status: status
    });
  }
  await Thread.findOneAndUpdate({userId: user._id }, {userStatus: status});
  emitToAdmin('user_status_changed', {userId: user._id, status});
};