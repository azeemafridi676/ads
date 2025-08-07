import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI: string | undefined = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error('MONGO_URI is not defined in the environment variables');
}

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  heartbeatFrequencyMS: 2000
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error: Error) => {
    console.error('Error connecting to MongoDB:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    console.error('Connection string used:', MONGO_URI.replace(/:[^:/@]+@/, ':****@'));
  });
