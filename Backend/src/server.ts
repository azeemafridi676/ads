import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import http from 'http';
import dotenv from 'dotenv';
// Import database connection
import './database/connection';
import fs from 'fs';
import path from 'path';
// Import routes
import userRouter from './routes/userRouter';
import subscriptionsRouter from './routes/subscriptionsRouter';
import locationRouter from "./routes/locationRouter";
import campaignRouter from "./routes/campaignRouter";
import electronRouter from "./routes/driverRouter";
import notificationRouter from "./routes/notificationRoutes";
import { createServer } from 'http';
import { initializeSocket } from './lib/socketConfig';
import chatRouter from './routes/chatRouter';
import dashboardRouter from './routes/dashboardRouter';
import reviewsRouter from './routes/reviewRouter';
import passport from './config/passport';
import { initializeTransporter } from './lib/emailConfig';

const app = express();

// Middleware
app.use((req, res, next) => {
  if (req.originalUrl === '/api/subscriptions/stripe/webhooks') {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(cors());
dotenv.config();

// route to log that which endpoint is being hit
app.use((req: Request, res: Response, next: NextFunction) => {
  const logMessage = `Endpoint ${req.originalUrl} is hit`;
  console.log(logMessage);
  next();
});

// Initialize passport without session
app.use(passport.initialize());

// Router setup
app.use('/api/user', userRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/location', locationRouter);
app.use('/api/campaign', campaignRouter);
app.use('/api/chat', chatRouter);
app.use('/api/electron', electronRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reviews', reviewsRouter);

// Basic route
app.get("/", (req: Request, res: Response) => {
  res.send("API server is up and running!");
});

// Server setup
const PORT = process.env.PORT || 3000;
const STATUS = process.env.STATUS;

const httpServer = createServer(app);
const io = initializeSocket(httpServer);

// Create the debugging-logs/frontend-logs directory if it doesn't exist
const logsDirectory = path.join(__dirname, 'debugging-logs', 'frontend-logs');
if (!fs.existsSync(logsDirectory)) {
  fs.mkdirSync(logsDirectory, { recursive: true });
}

// Route for handling log requests
app.post('/api/logs', (req: Request, res: Response) => {
  const logMessage = req.body.message;
  const logFilePath = path.join(logsDirectory, 'logs.txt');

  fs.appendFile(logFilePath, logMessage + '\n', (err) => {
    if (err) {
      console.error('Error writing log to file:', err);
      res.status(500).json({ error: 'Error writing log to file' });
    } else {
      res.status(200).json({ message: 'Log written to file' });
    }
  });
});

// Initialize services at startup
async function initializeServices() {
  try {
    // Initialize email service
    await initializeTransporter();
    console.log('Email service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

httpServer.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeServices();
});
