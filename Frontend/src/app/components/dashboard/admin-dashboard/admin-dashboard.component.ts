import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { DashboardService, AdminDashboardData } from 'src/app/shared/service/dashboard/dashboard.service';
import { NavService } from 'src/app/shared/service/navbar/nav.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  // Dashboard metrics
  totalUsers: number = 0;
  totalRevenue: number = 0;
  totalCampaigns: number = 0;
  totalViews: number = 0;
  currentMonthRevenue: number = 0;

  // Growth rates
  userGrowthRate: number = 0;
  revenueGrowthRate: number = 0;
  campaignGrowthRate: number = 0;
  userGrowthMonth: string = '';
  revenueGrowthMonth: string = '';
  campaignGrowthMonth: string = '';

  // Loading state
  isLoading: boolean = true;

  // Chart instances
  private revenueChart: Chart | null = null;
  private userGrowthChart: Chart | null = null;

  // Chart timeframes
  revenueTimeframe: 'weekly' | 'monthly' | 'yearly' = 'monthly';
  userTimeframe: 'weekly' | 'monthly' | 'yearly' = 'monthly';

  // Recent activities
  recentActivities: any[] = [];
  users: any[] = [];

  // Dashboard data
  dashboardData: AdminDashboardData | null = null;

  constructor(
    private dashboardService: DashboardService,
    private navService: NavService
  ) {}

  ngOnInit() {
    this.navService.setTitle('Admin Dashboard');
    this.navService.setSubtitle('Monitor platform performance, user growth, and revenue metrics');
    this.loadDashboardData();
  }

  getDaysRemaining(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  ngAfterViewInit() {
    if (this.dashboardData) {
      setTimeout(() => {
        this.initializeCharts(this.dashboardData!);
      });
    }
  }

  private loadDashboardData() {
    this.isLoading = true;
    this.dashboardService.getAdminDashboardData().subscribe({
      next: (response) => {
        const { data } = response;
        this.dashboardData = data;
        
        // Update dashboard metrics
        this.totalUsers = data.stats.totalUsers;
        this.totalRevenue = data.stats.totalRevenue;
        this.totalCampaigns = data.stats.totalCampaigns;
        this.totalViews = data.stats.totalViews;
        this.currentMonthRevenue = data.stats.currentMonthRevenue;

        // Update growth rates and month names
        this.userGrowthRate = data.stats.growth.users.percentage;
        this.revenueGrowthRate = data.stats.growth.revenue.percentage;
        this.campaignGrowthRate = data.stats.growth.campaigns.percentage;
        this.userGrowthMonth = data.stats.growth.users.monthName;
        this.revenueGrowthMonth = data.stats.growth.revenue.monthName;
        this.campaignGrowthMonth = data.stats.growth.campaigns.monthName;

        this.isLoading = false;

        // Initialize charts after view is ready
        setTimeout(() => {
          this.initializeCharts(data);
        });
      },
      error: (error) => {
        console.error('Error loading admin dashboard data:', error);
        this.isLoading = false;
      }
    });
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  private initializeCharts(data: AdminDashboardData) {
    // Destroy existing charts
    if (this.revenueChart) {
        this.revenueChart.destroy();
    }
    if (this.userGrowthChart) {
        this.userGrowthChart.destroy();
    }

    this.initRevenueChart(data);
    this.initUserGrowthChart(data);
  }

  private initRevenueChart(data: AdminDashboardData) {
    const ctx = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!ctx) return;

    const gradient1 = ctx.getContext('2d')?.createLinearGradient(0, 0, 0, 300);
    if (!gradient1) return;

    gradient1.addColorStop(0, 'rgba(235, 118, 65, 0.2)');
    gradient1.addColorStop(1, 'rgba(235, 118, 65, 0)');

    this.revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.chartData.revenueChart.labels,
        datasets: [
          {
            label: 'Revenue',
            data: data.chartData.revenueChart.data,
            borderColor: '#eb7641',
            backgroundColor: gradient1,
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: '#eb7641',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointHoverRadius: 6,
            pointHoverBorderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#464448',
            bodyColor: '#464448',
            borderColor: '#e1e1e1',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              },
              padding: 10
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              padding: 10
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }

  private initUserGrowthChart(data: AdminDashboardData) {
    const ctx = document.getElementById('userGrowthChart') as HTMLCanvasElement;
    if (!ctx) return;

    const gradient1 = ctx.getContext('2d')?.createLinearGradient(0, 0, 0, 400);
    if (!gradient1) return;

    gradient1.addColorStop(0, '#eb7641');
    gradient1.addColorStop(1, 'rgba(235, 118, 65, 0.7)');

    this.userGrowthChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.chartData.subscriptionDistribution.labels,
        datasets: [
          {
            label: 'Users by Plan',
            data: data.chartData.subscriptionDistribution.data,
            backgroundColor: gradient1,
            borderRadius: 8,
            borderSkipped: false,
            barPercentage: 0.6,
            categoryPercentage: 0.7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: 'rectRounded'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#464448',
            bodyColor: '#464448',
            borderColor: '#e1e1e1',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toLocaleString() + ' users';
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              padding: 10
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              padding: 10
            }
          }
        }
      }
    });
  }

  onTimeframeChange() {
    if (this.dashboardData) {
      this.initializeCharts(this.dashboardData);
    }
  }

  ngOnDestroy() {
    if (this.revenueChart) {
      this.revenueChart.destroy();
    }
    if (this.userGrowthChart) {
      this.userGrowthChart.destroy();
    }
  }
}
