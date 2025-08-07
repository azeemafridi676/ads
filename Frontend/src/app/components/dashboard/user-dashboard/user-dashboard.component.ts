import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { DashboardService, DashboardData } from 'src/app/shared/service/dashboard/dashboard.service';
import { NavService } from 'src/app/shared/service/navbar/nav.service';
import { SubscriptionsService } from 'src/app/shared/service/subscriptions/subscriptions.service';
import { Router } from '@angular/router';

interface StatsGrowth {
  percentage: number;
  trend: 'up' | 'down';
  monthName: string;
}

interface DashboardStats {
  campaigns: StatsGrowth;
  locations: StatsGrowth;
  views: StatsGrowth;
}

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss']
})
export class UserDashboardComponent implements OnInit {
  // Dashboard metrics
  activeCampaigns: number = 0;
  activeLocations: number = 0;
  totalViews: number = 0;
  currentPlan: any = null;
  planUsagePercentage: number = 0;
  daysRemaining: number = 0;
  
  // Recent campaigns
  recentCampaigns: any[] = [];

  // Loading state
  isLoading: boolean = true;

  statsGrowth: DashboardStats = {
    campaigns: { percentage: 0, trend: 'up', monthName: '' },
    locations: { percentage: 0, trend: 'up', monthName: '' },
    views: { percentage: 0, trend: 'up', monthName: '' }
  };

  constructor(
    private dashboardService: DashboardService,
    private subscriptionService: SubscriptionsService,
    private navService: NavService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadDashboardData();
    this.navService.setTitle('Dashboard Overview');
    this.navService.setSubtitle('Track your campaign performance and subscription status');
  }

  private loadDashboardData() {
    this.isLoading = true;
    this.dashboardService.getUserDashboardData().subscribe({
      next: (response) => {
        const { data } = response;
        
        // Update dashboard metrics
        this.activeCampaigns = data.activeCampaigns;
        this.activeLocations = data.activeLocations;
        this.totalViews = data.totalViews;
        
        // Update subscription info
        this.currentPlan = data.currentPlan;
        this.planUsagePercentage = data.currentPlan.usagePercentage;
        this.daysRemaining = data.currentPlan.daysRemaining;
        
        // Update recent campaigns
        this.recentCampaigns = data.recentCampaigns;

        // Update growth stats
        this.statsGrowth = data.growth;

        this.isLoading = false;

        // Initialize charts after DOM is updated
        setTimeout(() => {
          this.initializeCharts(data.chartData);
        }, 0);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoading = false;
      }
    });
  }

  private initializeCharts(chartData: any) {
    const campaignCtx = document.getElementById('campaignChart') as HTMLCanvasElement;
    const locationCtx = document.getElementById('locationChart') as HTMLCanvasElement;

    if (campaignCtx && locationCtx) {
      // Campaign Performance Chart
      new Chart(campaignCtx, {
        type: 'line',
        data: {
          labels: chartData.campaignPerformance.labels.length > 0 
            ? chartData.campaignPerformance.labels 
            : [],
          datasets: [{
            label: 'Ad Views',
            data: chartData.campaignPerformance.data.length > 0 
              ? chartData.campaignPerformance.data 
              : [],
            borderColor: '#eb7641',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });

      // Location Distribution Chart
      new Chart(locationCtx, {
        type: 'doughnut',
        data: {
          labels: chartData.locationDistribution.labels.length > 0 
            ? chartData.locationDistribution.labels 
            : [],
          datasets: [{
            data: chartData.locationDistribution.data.length > 0 
              ? chartData.locationDistribution.data 
              : [],
            backgroundColor: [
              '#eb7641',
              '#f4a261',
              '#e76f51',
              '#2a9d8f',
              '#264653'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }
  }

  onViewAllCampaigns() {
    this.router.navigate(['/dashboard/campaigns']);
  }

  onCreateCampaign() {
    this.router.navigate(['/dashboard/create-campaign']);
  }

  onEditCampaign(campaignId: string) {
    this.router.navigate([`/dashboard/update-campaign/${campaignId}`]);
  }

  onViewCampaign(campaignId: string) {
    this.router.navigate([`/dashboard/campaign-details/${campaignId}`]);
  }
}
