import mongoose, { Schema, Document } from 'mongoose';
import timestampPlugin from './plugin/timestampPlugin/timeStampPlugin';
import moment from 'moment-timezone';
const timezone = process.env.TZ;
if (!timezone) {
    throw new Error('TZ environment variable must be set');
}
// Location interface (referenced from location model)
export interface ILocation extends Document {
  _id: mongoose.Types.ObjectId;
  latitude: number;
  longitude: number;
  locationName: string;
  radius: number;
  state: string;
}

// Add this interface for played locations
interface IPlayedLocation {
  latitude: number;
  longitude: number;
  playedAt: string;
}

// Campaign interface
export interface ICampaign extends Document {
  campaignName: string;
  startDateTime: string;
  endDateTime: string;
  selectedLocations: mongoose.Types.ObjectId[] | ILocation[];
  mediaType: 'video' | 'image';
  mediaUrl: string;
  mediaDuration?: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'scheduled' | 'completed' | 'paused';
  approvalStatus: {
    isApproved: boolean;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    rejectionReason?: string;
  };
  userId: mongoose.Types.ObjectId;
  runCycleCount: number;
  hasCompletedCycles: boolean;
  createdAt: Date;
  updatedAt: Date;
  assignToDriverId: mongoose.Types.ObjectId;
  downloadedUrl?: string;
  isDownloaded?: boolean;
  playedLocations: IPlayedLocation[];
}

const campaignSchema: Schema<ICampaign> = new Schema({
  campaignName: { 
    type: String, 
    required: [true, 'Campaign name is required'],
    minlength: [5, 'Campaign name must be at least 5 characters long']
  },
  startDateTime: { 
    type: String, 
    required: [true, 'Start date and time is required']
  },
  endDateTime: { 
    type: String, 
    required: [true, 'End date and time is required']
  },
  selectedLocations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Locations',
    required: [true, 'At least one location is required']
  }],
  mediaType: {
    type: String,
    enum: ['video', 'image'],
    required: [true, 'Media type is required']
  },
  mediaUrl: {
    type: String,
    required: [true, 'Media URL is required']
  },
  mediaDuration: {
    type: Number,
    required: function(this: ICampaign) {
      return this.mediaType === 'video';
    },
    // Duration stored in seconds
    validate: {
      validator: function(v: number) {
        return v > 0;
      },
      message: 'Duration must be greater than 0 seconds'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'scheduled', 'completed', 'paused'],
    default: 'pending'
  },
  approvalStatus: {
    isApproved: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    rejectionReason: String
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  runCycleCount: {
    type: Number,
    default: 0
  },
  hasCompletedCycles: {
    type: Boolean,
    default: false
  },
  assignToDriverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // required: [true, 'Driver Id is required']
  },
  downloadedUrl: {
    type: String,
    default: null
  },
  isDownloaded: {
    type: Boolean,
    default: false
  },
  playedLocations: [{
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    playedAt: {
      type: String,
      default: moment().tz(timezone)
    }
  }]
});

// Add timestamps plugin
campaignSchema.plugin(timestampPlugin);

// Add indexes for better query performance
campaignSchema.index({ userId: 1, status: 1 });
campaignSchema.index({ startDateTime: 1, endDateTime: 1 });
campaignSchema.index({ 'approvalStatus.isApproved': 1, status: 1 });

// Methods for campaign approval management
campaignSchema.methods.approve = async function(adminId: mongoose.Types.ObjectId) {
  const tz = process.env.TZ || 'UTC';
  const currentDate = moment().tz(tz);
  const startDate = moment.tz(this.startDateTime as string, tz);
  const endDate = moment.tz(this.endDateTime as string, tz);

  this.approvalStatus = {
    isApproved: true,
    approvedBy: adminId,
    approvedAt: currentDate.toDate()
  };
  this.status = 'approved';
  
  if (currentDate.isBetween(startDate, endDate, undefined, '[]')) {
    this.status = 'active';
  } else if (currentDate.isBefore(startDate)) {
    this.status = 'scheduled';
  }
  
  await this.save();
};

campaignSchema.methods.reject = async function(adminId: mongoose.Types.ObjectId, reason: string) {
  this.approvalStatus = {
    isApproved: false,
    approvedBy: adminId,
    approvedAt: moment().tz(timezone),
    rejectionReason: reason
  };
  this.status = 'rejected';
  await this.save();
};

// Method to check if campaign is active
campaignSchema.methods.isActive = function(): boolean {
  const now = moment().tz(timezone);
  const startDate = moment.tz(this.startDateTime, timezone);
  const endDate = moment.tz(this.endDateTime, timezone);
  
  return this.status === 'active' && 
         this.approvalStatus.isApproved &&
         now.isAfter(startDate) && 
         now.isBefore(endDate);
};


// Virtual for campaign duration
campaignSchema.virtual('durationInDays').get(function(this: ICampaign) {
  const tz = process.env.TZ || 'UTC';
  const startDate = moment.tz(this.startDateTime as string, tz);
  const endDate = moment.tz(this.endDateTime as string, tz);
  return endDate.diff(startDate, 'days', true);
});

// Virtual for remaining time
campaignSchema.virtual('remainingTime').get(function(this: ICampaign) {
  if (!this.approvalStatus.isApproved) return 0;
  
  const tz = process.env.TZ || 'UTC';
  const now = moment().tz(tz);
  const startDate = moment.tz(this.startDateTime as string, tz);
  const endDate = moment.tz(this.endDateTime as string, tz);
  
  if (now.isAfter(endDate)) return 0;
  if (now.isBefore(startDate)) {
    return endDate.diff(startDate);
  }
  return endDate.diff(now);
});


const Campaign = mongoose.model<ICampaign>('Campaign', campaignSchema);

export default Campaign;