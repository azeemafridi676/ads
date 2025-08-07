import mongoose, { Schema, Document } from 'mongoose';
import timestampPlugin from './plugin/timestampPlugin/timeStampPlugin';
import bcrypt from 'bcryptjs';
interface IUser extends Document {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
  role: 'driver' | 'admin' | 'user';
  otp: string | null;
  profileImage: string | null;
  resetToken: string | null;
  resetTokenExpiry: Number | null;
  verificationId: string;
  Dob: Date | null;
  stripeCustomerId: string;
  status: 'online' | 'offline';
  currentSubscription: mongoose.Types.ObjectId;
  subscriptionStatus: 'active' | 'inactive' | 'payment_failed';
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  isGiftedSubscription: boolean;
  giftedBy: mongoose.Types.ObjectId | null;
  giftedAt: Date | null;
  isBanned: boolean;
  banReason: string | null;
  bannedAt: Date | null;
  bannedBy: mongoose.Types.ObjectId | null;
}
const userSchema: Schema<IUser> = new Schema({
  firstName: { type: String },
  lastName: { type: String },
  phoneNumber: { type: String },
  email: { type: String },
  password: { type: String },
  role: { type: String, enum: ['driver', 'admin', 'user'] },
  otp: { type: String, default: null },
  Dob: { type: Date, default: null },
  profileImage: { type: String, default: null },
  verificationId: { type: String ,default:null},
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Number, default: null },
  stripeCustomerId: {type:String,default:null},
  status: { type: String, enum: ['online', 'offline'], default: 'offline' },
  currentSubscription: { type: Schema.Types.ObjectId, ref: 'Subscription' },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'payment_failed'],
    default: 'inactive'
  },
  subscriptionStartDate: Date,
  subscriptionEndDate: Date,
  isGiftedSubscription: { type: Boolean, default: false },
  giftedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  giftedAt: { type: Date, default: null },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: null },
  bannedAt: { type: Date, default: null },
  bannedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
});

userSchema.plugin(timestampPlugin);

const User = mongoose.model<IUser>('User', userSchema);

const seedSuperAdmin = async () => {
  const adminExists = await User.findOne({ role: 'admin' });
  
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'support@gmail.com',
      password: hashedPassword,
      role: 'admin',
      phoneNumber: '1234567890'
    });
    console.log('Default super admin created');
  }
};

seedSuperAdmin().catch(console.error);

export default User;