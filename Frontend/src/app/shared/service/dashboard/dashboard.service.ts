import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

// API Response interface
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface DashboardData {
  activeCampaigns: number;
  activeLocations: number;
  totalViews: number;
  currentPlan: {
    planName: string;
    usagePercentage: number;
    daysRemaining: number;
  };
  recentCampaigns: Array<{
    name: string;
    locations: number;
    views: number;
    status: string;
    date: string;
    startDateTime: string;
    endDateTime: string;
  }>;
  chartData: {
    campaignPerformance: {
      labels: string[];
      data: number[];
    };
    locationDistribution: {
      labels: string[];
      data: number[];
    };
  };
  growth: {
    campaigns: { percentage: number; trend: 'up' | 'down'; monthName: string };
    locations: { percentage: number; trend: 'up' | 'down'; monthName: string };
    views: { percentage: number; trend: 'up' | 'down'; monthName: string };
  };
}

export interface AdminDashboardData {
  stats: {
    totalUsers: number;
    totalCampaigns: number;
    totalLocations: number;
    totalViews: number;
    totalRevenue: number;
    currentMonthRevenue: number;
    previousMonthUsers?: number;
    previousMonthRevenue?: number;
    previousMonthCampaigns?: number;
    growth: {
      users: { percentage: number; trend: 'up' | 'down'; monthName: string };
      revenue: { percentage: number; trend: 'up' | 'down'; monthName: string };
      campaigns: { percentage: number; trend: 'up' | 'down'; monthName: string };
    };
  };
  chartData: {
    revenueChart: {
      labels: string[];
      data: number[];
    };
    subscriptionDistribution: {
      labels: string[];
      data: number[];
    };
  };
  users: Array<{
    id: string;
    email: string;
    name: string;
    status: 'active' | 'inactive' | 'payment_failed';
    joinDate: string;
    subscription: string;
    locationLimit: number;
    subscriptionEndDate: string;
    price: number;
  }>;
}

@Injectable({
  providedIn: "root",
})
export class DashboardService {
  private backendUrl = environment.BACKEND_URL;
  private GET_USER_DASHBOARD_DATA = `${this.backendUrl}/api/dashboard/user`;
  private GET_ADMIN_DASHBOARD_DATA = `${this.backendUrl}/api/dashboard/admin`;

  constructor(private http: HttpClient) {}

  getUserDashboardData(): Observable<ApiResponse<DashboardData>> {
    return this.http.get<ApiResponse<DashboardData>>(`${this.GET_USER_DASHBOARD_DATA}`);
  }

  getAdminDashboardData(): Observable<ApiResponse<AdminDashboardData>> {
    return this.http.get<ApiResponse<AdminDashboardData>>(`${this.GET_ADMIN_DASHBOARD_DATA}`);
  }
}
