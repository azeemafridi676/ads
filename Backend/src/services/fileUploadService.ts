import { Readable } from 'stream';
import {s3} from '../lib/awsConfig' 
export const uploadFileToS3 = async (file: Express.Multer.File): Promise<string> => {
    try {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: `profiles/${Date.now()}-${file.originalname}`, 
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      const response = await s3.upload(params).promise();
      return response.Location; 
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error('Error uploading file to S3');
    }
  };
