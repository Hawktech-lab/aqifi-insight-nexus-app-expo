import { supabase } from '../integrations/supabase/client';
import DeviceFingerprintingService from './DeviceFingerprintingService';

export interface BehavioralPattern {
  id: string;
  user_id: string;
  pattern_type: 'location_pattern' | 'app_usage_pattern' | 'device_interaction_pattern' | 'temporal_pattern';
  pattern_data: Record<string, any>;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export interface BehavioralEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, any>;
  timestamp: string;
  session_id?: string;
  device_fingerprint_id?: string;
}

export interface BehavioralInsight {
  insight_type: string;
  insight_data: Record<string, any>;
  confidence: number;
  timestamp: string;
}

class BehavioralAnalyticsService {
  private static instance: BehavioralAnalyticsService;
  private deviceFingerprintingService: DeviceFingerprintingService;
  private isInitialized = false;
  private currentUserId: string | null = null;

  private constructor() {
    this.deviceFingerprintingService = DeviceFingerprintingService.getInstance();
  }

  public static getInstance(): BehavioralAnalyticsService {
    if (!BehavioralAnalyticsService.instance) {
      BehavioralAnalyticsService.instance = new BehavioralAnalyticsService();
    }
    return BehavioralAnalyticsService.instance;
  }

  public async initialize(userId: string): Promise<void> {
    if (this.isInitialized && this.currentUserId === userId) return;

    this.currentUserId = userId;
    
    try {
      await this.deviceFingerprintingService.initialize();
      this.isInitialized = true;
      console.log('BehavioralAnalyticsService initialized for user:', userId);
    } catch (error) {
      console.error('Failed to initialize BehavioralAnalyticsService:', error);
      throw error;
    }
  }

  public async analyzeUserBehavior(): Promise<BehavioralInsight[]> {
    if (!this.currentUserId) {
      throw new Error('BehavioralAnalyticsService not initialized');
    }

    const insights: BehavioralInsight[] = [];

    try {
      // Analyze location patterns
      const locationInsights = await this.analyzeLocationPatterns();
      insights.push(...locationInsights);

      // Analyze app usage patterns
      const appUsageInsights = await this.analyzeAppUsagePatterns();
      insights.push(...appUsageInsights);

      // Analyze device interaction patterns
      const deviceInsights = await this.analyzeDeviceInteractionPatterns();
      insights.push(...deviceInsights);

      // Analyze temporal patterns
      const temporalInsights = await this.analyzeTemporalPatterns();
      insights.push(...temporalInsights);

      // Save insights to database
      await this.saveBehavioralInsights(insights);

      return insights;
    } catch (error) {
      console.error('Failed to analyze user behavior:', error);
      return insights;
    }
  }

  private async analyzeLocationPatterns(): Promise<BehavioralInsight[]> {
    const insights: BehavioralInsight[] = [];

    try {
      // Get location data from earnings transactions
      const { data: locationData, error } = await supabase
        .from('earnings_transactions')
        .select('*')
        .eq('user_id', this.currentUserId)
        .eq('transaction_type', 'location_data')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !locationData || locationData.length === 0) {
        return insights;
      }

      // Analyze location patterns
      const locations = locationData.map(transaction => {
        const locationInfo = {}; // reference_id is now null, no JSON parsing needed
        return {
          latitude: locationInfo.latitude,
          longitude: locationInfo.longitude,
          timestamp: transaction.created_at,
          city: locationInfo.city,
          state: locationInfo.state,
        };
      });

      // Most frequent locations
      const locationCounts = locations.reduce((acc, location) => {
        const key = `${location.city}, ${location.state}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostFrequentLocation = Object.entries(locationCounts)
        .sort(([,a], [,b]) => b - a)[0];

      if (mostFrequentLocation) {
        insights.push({
          insight_type: 'frequent_location',
          insight_data: {
            location: mostFrequentLocation[0],
            visit_count: mostFrequentLocation[1],
            total_locations: locations.length
          },
          confidence: Math.min(mostFrequentLocation[1] / locations.length, 1),
          timestamp: new Date().toISOString()
        });
      }

      // Movement patterns
      if (locations.length > 1) {
        const totalDistance = this.calculateTotalDistance(locations);
        insights.push({
          insight_type: 'movement_pattern',
          insight_data: {
            total_distance_km: totalDistance,
            average_daily_movement: totalDistance / Math.max(locations.length / 24, 1),
            location_diversity: Object.keys(locationCounts).length
          },
          confidence: 0.8,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Failed to analyze location patterns:', error);
    }

    return insights;
  }

  private async analyzeAppUsagePatterns(): Promise<BehavioralInsight[]> {
    const insights: BehavioralInsight[] = [];

    try {
      // Get all user transactions to analyze app usage
      const { data: transactions, error } = await supabase
        .from('earnings_transactions')
        .select('*')
        .eq('user_id', this.currentUserId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error || !transactions || transactions.length === 0) {
        return insights;
      }

      // Analyze transaction patterns
      const transactionTypes = transactions.map(t => t.transaction_type);
      const typeCounts = transactionTypes.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Most active data stream
      const mostActiveStream = Object.entries(typeCounts)
        .sort(([,a], [,b]) => b - a)[0];

      if (mostActiveStream) {
        insights.push({
          insight_type: 'most_active_stream',
          insight_data: {
            stream_type: mostActiveStream[0],
            activity_count: mostActiveStream[1],
            total_activities: transactions.length
          },
          confidence: Math.min(mostActiveStream[1] / transactions.length, 1),
          timestamp: new Date().toISOString()
        });
      }

      // Engagement level
      const totalEarnings = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      insights.push({
        insight_type: 'engagement_level',
        insight_data: {
          total_earnings: totalEarnings,
          total_transactions: transactions.length,
          average_earnings_per_transaction: totalEarnings / transactions.length,
          engagement_score: Math.min(transactions.length / 10, 1) // Normalize to 0-1
        },
        confidence: 0.9,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to analyze app usage patterns:', error);
    }

    return insights;
  }

  private async analyzeDeviceInteractionPatterns(): Promise<BehavioralInsight[]> {
    const insights: BehavioralInsight[] = [];

    try {
      const deviceFingerprint = this.deviceFingerprintingService.getDeviceFingerprint();
      
      if (deviceFingerprint) {
        insights.push({
          insight_type: 'device_profile',
          insight_data: {
            device_type: deviceFingerprint.is_tablet ? 'tablet' : 'phone',
            os_type: deviceFingerprint.os_type,
            os_version: deviceFingerprint.os_version,
            screen_resolution: `${deviceFingerprint.screen_width}x${deviceFingerprint.screen_height}`,
            device_capabilities: {
              has_camera: deviceFingerprint.has_camera,
              has_gps: deviceFingerprint.has_gps,
              has_bluetooth: deviceFingerprint.has_bluetooth,
              has_nfc: deviceFingerprint.has_nfc
            }
          },
          confidence: 1.0,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Failed to analyze device interaction patterns:', error);
    }

    return insights;
  }

  private async analyzeTemporalPatterns(): Promise<BehavioralInsight[]> {
    const insights: BehavioralInsight[] = [];

    try {
      // Get recent transactions to analyze temporal patterns
      const { data: transactions, error } = await supabase
        .from('earnings_transactions')
        .select('created_at')
        .eq('user_id', this.currentUserId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !transactions || transactions.length === 0) {
        return insights;
      }

      // Analyze time patterns
      const hours = transactions.map(t => new Date(t.created_at).getHours());
      const hourCounts = hours.reduce((acc, hour) => {
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      // Most active hour
      const mostActiveHour = Object.entries(hourCounts)
        .sort(([,a], [,b]) => b - a)[0];

      if (mostActiveHour) {
        insights.push({
          insight_type: 'peak_activity_time',
          insight_data: {
            hour: parseInt(mostActiveHour[0]),
            activity_count: mostActiveHour[1],
            total_activities: transactions.length
          },
          confidence: Math.min(mostActiveHour[1] / transactions.length, 1),
          timestamp: new Date().toISOString()
        });
      }

      // Activity frequency
      const timeSpan = transactions.length > 1 
        ? new Date(transactions[0].created_at).getTime() - new Date(transactions[transactions.length - 1].created_at).getTime()
        : 0;
      
      const daysSpan = timeSpan / (1000 * 60 * 60 * 24);
      const dailyActivity = daysSpan > 0 ? transactions.length / daysSpan : 0;

      insights.push({
        insight_type: 'activity_frequency',
        insight_data: {
          daily_activity_rate: dailyActivity,
          total_activities: transactions.length,
          time_span_days: daysSpan
        },
        confidence: 0.8,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to analyze temporal patterns:', error);
    }

    return insights;
  }

  private async saveBehavioralInsights(insights: BehavioralInsight[]): Promise<void> {
    if (!this.currentUserId || insights.length === 0) return;

    try {
      // Save insights as earnings transactions
      for (const insight of insights) {
        await supabase
          .from('earnings_transactions')
          .insert({
            user_id: this.currentUserId,
            amount: 0.002, // $0.002 per behavioral insight
            points: 1,
            transaction_type: 'behavioral_insight',
            description: `Behavioral insight: ${insight.insight_type}`,
            reference_id: null // reference_id is UUID type, not JSON - set to null for behavioral data
          });
      }

      // Update data stream count
      const { data: streamRow } = await supabase
        .from('data_streams')
        .select('data_count')
        .eq('user_id', this.currentUserId)
        .eq('stream_type', 'behavioral')
        .single();

      const newCount = (streamRow?.data_count || 0) + insights.length;

      await supabase
        .from('data_streams')
        .update({
          data_count: newCount,
          last_sync_at: new Date().toISOString()
        })
        .eq('user_id', this.currentUserId)
        .eq('stream_type', 'behavioral');

      console.log('Behavioral insights saved:', insights.length);
    } catch (error) {
      console.error('Failed to save behavioral insights:', error);
    }
  }

  private calculateTotalDistance(locations: Array<{latitude: number, longitude: number}>): number {
    let totalDistance = 0;
    
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      totalDistance += this.calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    }
    
    return totalDistance;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  public async trackEvent(eventType: string, eventData?: Record<string, any>): Promise<void> {
    if (!this.currentUserId) return;

    try {
      await supabase
        .from('earnings_transactions')
        .insert({
          user_id: this.currentUserId,
          amount: 0.001, // $0.001 per behavioral event
          points: 1,
          transaction_type: 'behavioral_event',
          description: `Behavioral event: ${eventType}`,
          reference_id: null // reference_id is UUID type, not JSON - set to null for behavioral events
        });
    } catch (error) {
      console.error('Failed to track behavioral event:', error);
    }
  }

  public async getBehavioralHistory(limit: number = 50): Promise<BehavioralEvent[]> {
    if (!this.currentUserId) return [];

    try {
      const { data, error } = await supabase
        .from('earnings_transactions')
        .select('*')
        .eq('user_id', this.currentUserId)
        .in('transaction_type', ['behavioral_insight', 'behavioral_event'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(transaction => {
        const eventInfo = {}; // reference_id is now null, no JSON parsing needed
        return {
          id: transaction.id,
          user_id: transaction.user_id,
          event_type: eventInfo.event_type || transaction.transaction_type,
          event_data: eventInfo.event_data || eventInfo,
          timestamp: eventInfo.timestamp || transaction.created_at,
        };
      });
    } catch (error) {
      console.error('Failed to get behavioral history:', error);
      return [];
    }
  }

  public async cleanup(): Promise<void> {
    this.isInitialized = false;
    this.currentUserId = null;
  }
}

export default BehavioralAnalyticsService;
