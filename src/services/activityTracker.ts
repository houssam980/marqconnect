import { apiRequest } from '../config/api.config';

class ActivityTracker {
  private sessionId: string | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds

  /**
   * Start tracking user activity
   */
  async start() {
    try {
      // Get device info
      const deviceInfo = this.getDeviceInfo();

      // Start session
      const response = await apiRequest('/activity/start', {
        method: 'POST',
        body: JSON.stringify({ device_info: deviceInfo }),
      });

      const data = await response.json();
      this.sessionId = data.session_id;
      console.log('Activity tracking started:', this.sessionId);

      // Start heartbeat
      this.startHeartbeat();

      // Listen for page unload
      this.setupUnloadListener();
    } catch (error) {
      console.error('Failed to start activity tracking:', error);
    }
  }

  /**
   * Send heartbeat to keep session alive
   */
  private async sendHeartbeat() {
    if (!this.sessionId) return;

    try {
      await apiRequest('/activity/heartbeat', {
        method: 'POST',
        body: JSON.stringify({ session_id: this.sessionId }),
      });
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
      // If heartbeat fails, try to restart session
      if (error instanceof Error && error.message.includes('404')) {
        this.stop();
        this.start();
      }
    }
  }

  /**
   * Start heartbeat interval
   */
  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * End tracking session
   */
  async stop() {
    if (!this.sessionId) return;

    try {
      // Clear heartbeat interval
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      // Send end session request
      await apiRequest('/activity/end', {
        method: 'POST',
        body: JSON.stringify({ session_id: this.sessionId }),
      });

      console.log('Activity tracking stopped');
    } catch (error) {
      console.error('Failed to stop activity tracking:', error);
    } finally {
      this.sessionId = null;
    }
  }

  /**
   * Setup listener for page unload
   */
  private setupUnloadListener() {
    // Use sendBeacon for reliable delivery on page unload
    const handleUnload = () => {
      if (this.sessionId) {
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://104.248.226.62/api';
        const url = `${apiUrl}/activity/end`;
        
        const data = JSON.stringify({ session_id: this.sessionId });
        const blob = new Blob([data], { type: 'application/json' });
        
        navigator.sendBeacon(url, blob);
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    // Handle visibility change (when user switches tabs)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // User switched away - could pause heartbeat if needed
      } else {
        // User came back - ensure heartbeat is running
        if (this.sessionId && !this.heartbeatInterval) {
          this.startHeartbeat();
        }
      }
    });
  }

  /**
   * Get device and browser information
   */
  private getDeviceInfo(): string {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    // Detect browser
    let browser = 'Unknown';
    if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    // Detect OS
    let os = 'Unknown';
    if (platform.includes('Win')) os = 'Windows';
    else if (platform.includes('Mac')) os = 'macOS';
    else if (platform.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';
    
    return `${browser} on ${os}`;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Check if tracking is active
   */
  isActive(): boolean {
    return this.sessionId !== null;
  }
}

// Export singleton instance
export const activityTracker = new ActivityTracker();
