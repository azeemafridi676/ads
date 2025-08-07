interface Location {
  _id: string;
  userId: string;
  latitude: number;
  longitude: number;
  locationName: string;
  radius: number;
  state: string;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  _id: string;
  campaignName: string;
  startDateTime: string;
  endDateTime: string;
  selectedLocations: Location[];
  mediaType: string;
  mediaUrl: string;
  mediaDuration: number;
  status: string;
  userId: {
    currentSubscription?: {
      _id: string;
      runCycleLimit: number;
      currentCycles: number;
      isCompleted: boolean;
    }
  };
  runCycleCount: number;
  downloadedUrl?: string;
  isDownloaded: boolean;
  approvalStatus: {
    isApproved: boolean;
    approvedAt: string;
    approvedBy: string;
  };
  assignToDriverId?: string;
  createdAt: string;
  updatedAt: string;
  maxRunCycleCount?: number;
}
