import { supabase } from '../integrations/supabase/client';

type SpatialConfig = {
  cellSizeDegrees: number; // grid size in degrees, e.g., 0.01 ~ 1.1km
  minimumDwellMs: number;  // minimum dwell time to count a visit
};

type LatLng = { latitude: number; longitude: number; timestamp: number };

/**
 * SpatialDataService derives coarse spatial visits from location updates.
 * It aggregates user movement into grid cells and records a visit when the user
 * dwells in a cell at least `minimumDwellMs`. It also updates the `spatial` data stream counts.
 */
class SpatialDataService {
  private static instance: SpatialDataService;

  private currentUserId: string | null = null;
  private isEnabledFromStream: boolean | null = null;
  private lastCellKey: string | null = null;
  private lastEnteredAtMs: number | null = null;
  private config: SpatialConfig = {
    cellSizeDegrees: 0.01,
    minimumDwellMs: 60_000, // 1 minute
  };

  public static getInstance(): SpatialDataService {
    if (!SpatialDataService.instance) {
      SpatialDataService.instance = new SpatialDataService();
    }
    return SpatialDataService.instance;
  }

  public async initialize(userId: string): Promise<void> {
    if (this.currentUserId === userId && this.isEnabledFromStream !== null) return;
    this.currentUserId = userId;
    // Fetch whether the spatial stream is enabled for this user
    try {
      const { data, error } = await supabase
        .from('data_streams')
        .select('is_enabled, earnings_rate')
        .eq('user_id', userId)
        .eq('stream_type', 'spatial')
        .single();
      if (!error && data) {
        this.isEnabledFromStream = !!data.is_enabled;
      } else {
        this.isEnabledFromStream = false;
      }
    } catch {
      this.isEnabledFromStream = false;
    }
  }

  public async handleLocation(userId: string, location: LatLng): Promise<void> {
    if (!userId) return;
    if (this.currentUserId !== userId) {
      await this.initialize(userId);
    }
    if (!this.isEnabledFromStream) return;

    const cellKey = this.computeCellKey(location.latitude, location.longitude);
    const nowMs = location.timestamp;

    if (this.lastCellKey == null) {
      this.lastCellKey = cellKey;
      this.lastEnteredAtMs = nowMs;
      return;
    }

    if (cellKey !== this.lastCellKey) {
      const dwellMs = this.lastEnteredAtMs ? nowMs - this.lastEnteredAtMs : 0;
      await this.recordVisitIfEligible(this.lastCellKey, dwellMs);
      this.lastCellKey = cellKey;
      this.lastEnteredAtMs = nowMs;
    }
  }

  public async flush(): Promise<void> {
    if (!this.currentUserId || !this.lastCellKey || !this.lastEnteredAtMs) return;
    const dwellMs = Date.now() - this.lastEnteredAtMs;
    await this.recordVisitIfEligible(this.lastCellKey, dwellMs);
    this.lastCellKey = null;
    this.lastEnteredAtMs = null;
  }

  private computeCellKey(lat: number, lon: number): string {
    const size = this.config.cellSizeDegrees;
    const latCell = Math.round(lat / size) * size;
    const lonCell = Math.round(lon / size) * size;
    // Fixed precision string to avoid floating drift in keys
    return `${latCell.toFixed(4)},${lonCell.toFixed(4)}`;
  }

  private async recordVisitIfEligible(cellKey: string, dwellMs: number): Promise<void> {
    if (!this.currentUserId) return;
    if (dwellMs < this.config.minimumDwellMs) return;

    const [latStr, lonStr] = cellKey.split(',');
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    try {
      // Get current stream row to get earnings rate
      const { data: streamRow } = await supabase
        .from('data_streams')
        .select('data_count, earnings_rate')
        .eq('user_id', this.currentUserId)
        .eq('stream_type', 'spatial')
        .single();

      const earningsRate = streamRow?.earnings_rate || 0.003; // Default $0.003 per spatial visit
      const newCount = (streamRow?.data_count ?? 0) + 1;

      // Store spatial data as earnings transaction
      const { error: transactionError } = await supabase
        .from('earnings_transactions')
        .insert({
          user_id: this.currentUserId,
          amount: earningsRate,
          points: 1, // Each spatial visit = 1 point
          transaction_type: 'spatial_data',
          description: `Spatial visit at ${lat.toFixed(4)}, ${lon.toFixed(4)} for ${Math.round(dwellMs / 1000)}s`,
          reference_id: null, // reference_id is UUID type, not JSON - set to null for spatial data
        });

      if (transactionError) {
        console.error('Failed to save spatial data as transaction:', transactionError);
      }

      // Update data_streams for 'spatial' to increment count and update last_sync_at
      await supabase
        .from('data_streams')
        .update({
          data_count: newCount,
          last_sync_at: new Date().toISOString(),
        })
        .eq('user_id', this.currentUserId)
        .eq('stream_type', 'spatial');

      console.log('Spatial visit recorded:', { cellKey, dwellMs, newCount });
    } catch (error) {
      console.error('Failed to record spatial visit:', error);
      // ignore errors; spatial is best-effort
    }
  }
}

export default SpatialDataService;


