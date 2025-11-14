import { getEmailStats } from './emailService.js';

// Email monitoring and health check utilities
export class EmailMonitor {
  constructor() {
    this.healthCheckInterval = null;
    this.alertThresholds = {
      failureRate: 20, // Alert if failure rate exceeds 20%
      consecutiveFailures: 5, // Alert after 5 consecutive failures
      dailyLimit: 400 // Alert when approaching Gmail daily limit
    };
  }

  // Start monitoring email health
  startMonitoring(intervalMs = 300000) { // Default: 5 minutes
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);

    console.log('Email monitoring started');
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    console.log('Email monitoring stopped');
  }

  // Perform health check
  performHealthCheck() {
    try {
      const stats = getEmailStats();
      const issues = [];

      // Check failure rate
      if (stats.successRate < (100 - this.alertThresholds.failureRate)) {
        issues.push(`High failure rate: ${stats.successRate.toFixed(2)}%`);
      }

      // Check daily limit
      if (stats.sent > this.alertThresholds.dailyLimit) {
        issues.push(`Approaching daily limit: ${stats.sent}/${this.alertThresholds.dailyLimit}`);
      }

      // Check for recent errors
      if (stats.lastError && this.isRecentError(stats.lastError.timestamp)) {
        issues.push(`Recent error: ${stats.lastError.message}`);
      }

      // Log issues
      if (issues.length > 0) {
        console.warn('Email health check issues:', issues);
        this.logHealthAlert(issues, stats);
      } else {
        console.log('Email health check passed:', {
          sent: stats.sent,
          failed: stats.failed,
          successRate: `${stats.successRate.toFixed(2)}%`
        });
      }
    } catch (error) {
      console.error('Email health check failed:', error);
    }
  }

  // Check if error is recent (within last hour)
  isRecentError(timestamp) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return new Date(timestamp) > oneHourAgo;
  }

  // Log health alert
  logHealthAlert(issues, stats) {
    const alert = {
      timestamp: new Date().toISOString(),
      issues: issues,
      stats: stats,
      severity: this.determineSeverity(issues, stats)
    };

    console.error('EMAIL HEALTH ALERT:', alert);
    
    // In production, you might want to send this to a monitoring service
    // or trigger additional alerts
  }

  // Determine alert severity
  determineSeverity(issues, stats) {
    if (stats.successRate < 50) return 'CRITICAL';
    if (stats.successRate < 80) return 'HIGH';
    if (stats.sent > this.alertThresholds.dailyLimit * 0.9) return 'MEDIUM';
    return 'LOW';
  }

  // Get current email status
  getStatus() {
    const stats = getEmailStats();
    return {
      ...stats,
      status: this.getOverallStatus(stats),
      uptime: this.getUptime(),
      recommendations: this.getRecommendations(stats)
    };
  }

  // Get overall status
  getOverallStatus(stats) {
    if (stats.successRate >= 95) return 'HEALTHY';
    if (stats.successRate >= 80) return 'WARNING';
    return 'CRITICAL';
  }

  // Get uptime (simplified)
  getUptime() {
    return process.uptime();
  }

  // Get recommendations based on stats
  getRecommendations(stats) {
    const recommendations = [];

    if (stats.successRate < 80) {
      recommendations.push('Check SMTP configuration and credentials');
      recommendations.push('Verify EMAIL_USER and EMAIL_PASS environment variables');
    }

    if (stats.sent > this.alertThresholds.dailyLimit * 0.8) {
      recommendations.push('Consider upgrading to a higher email service tier');
      recommendations.push('Implement email queuing for better rate management');
    }

    if (stats.retries > stats.sent * 0.1) {
      recommendations.push('High retry rate detected - check network connectivity');
    }

    return recommendations;
  }
}

// Create singleton instance
export const emailMonitor = new EmailMonitor();

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production') {
  emailMonitor.startMonitoring();
}

export default emailMonitor;
