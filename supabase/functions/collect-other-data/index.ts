import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simulate device metadata collection
function generateDeviceMetadata() {
  const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
  const platforms = ['Windows', 'macOS', 'Linux', 'iOS', 'Android'];
  const screenResolutions = ['1920x1080', '1366x768', '1536x864', '1440x900', '2560x1440'];
  
  return {
    browser: browsers[Math.floor(Math.random() * browsers.length)],
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    screenResolution: screenResolutions[Math.floor(Math.random() * screenResolutions.length)],
    userAgent: 'Mozilla/5.0 (simulated)',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: 'en-US',
  };
}

// Simulate behavioral data collection
function generateBehavioralData() {
  return {
    sessionDuration: Math.floor(Math.random() * 3600) + 300, // 5-65 minutes
    pageViews: Math.floor(Math.random() * 20) + 1,
    clickEvents: Math.floor(Math.random() * 50) + 5,
    scrollDepth: Math.floor(Math.random() * 100) + 1,
    timeOfDay: new Date().getHours(),
    dayOfWeek: new Date().getDay(),
  };
}

// Simulate WiFi network data
function generateWiFiData() {
  const networkNames = ['HomeNetwork', 'OfficeWiFi', 'CoffeeShop_Free', 'Library_Guest', 'Mobile_Hotspot'];
  const signalStrengths = [-30, -45, -60, -75]; // dBm values
  
  return {
    networkName: networkNames[Math.floor(Math.random() * networkNames.length)],
    signalStrength: signalStrengths[Math.floor(Math.random() * signalStrengths.length)],
    frequency: Math.random() > 0.5 ? '2.4GHz' : '5GHz',
    connectionTime: Math.floor(Math.random() * 7200) + 300, // 5 minutes to 2 hours
  };
}

// Simulate email metadata (without accessing content)
function generateEmailMetadata() {
  return {
    emailCount: Math.floor(Math.random() * 50) + 5,
    unreadCount: Math.floor(Math.random() * 15),
    sentCount: Math.floor(Math.random() * 10),
    averageEmailLength: Math.floor(Math.random() * 1000) + 100, // characters
    timeDistribution: {
      morning: Math.floor(Math.random() * 10),
      afternoon: Math.floor(Math.random() * 15),
      evening: Math.floor(Math.random() * 20),
      night: Math.floor(Math.random() * 5),
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting other data collection...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users with enabled data streams (excluding activity and location)
    const { data: dataStreams, error: streamsError } = await supabase
      .from('data_streams')
      .select('user_id, id, stream_type, earnings_rate')
      .eq('is_enabled', true)
      .not('stream_type', 'in', '(steps,location)');

    if (streamsError) {
      throw new Error(`Failed to fetch data streams: ${streamsError.message}`);
    }

    console.log(`Found ${dataStreams?.length || 0} other data streams to process`);

    const results = [];

    for (const stream of dataStreams || []) {
      try {
        let streamData: any;
        let dataPointCount = 0;
        
        switch (stream.stream_type) {
          case 'device_metadata':
            streamData = generateDeviceMetadata();
            dataPointCount = 1;
            break;
            
          case 'behavioral':
            streamData = generateBehavioralData();
            dataPointCount = streamData.pageViews + streamData.clickEvents;
            break;
            
          case 'wifi':
            streamData = generateWiFiData();
            dataPointCount = 1;
            break;
            
          case 'email_metadata':
            streamData = generateEmailMetadata();
            dataPointCount = streamData.emailCount;
            break;
            
          case 'spatial':
            // Simulate spatial movement data
            streamData = {
              orientationChanges: Math.floor(Math.random() * 100) + 10,
              movementPatterns: Math.floor(Math.random() * 50) + 5,
              deviceRotations: Math.floor(Math.random() * 30) + 2,
            };
            dataPointCount = streamData.orientationChanges;
            break;
            
          default:
            console.log(`Unknown stream type: ${stream.stream_type}`);
            continue;
        }

        // Update data stream with new data
        const { error: updateError } = await supabase
          .from('data_streams')
          .update({
            data_count: dataPointCount,
            last_sync_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', stream.id);

        if (updateError) {
          console.error(`Failed to update data stream ${stream.id}:`, updateError);
          continue;
        }

        // Calculate earnings
        const earnings = dataPointCount * (stream.earnings_rate || 0);
        
        // Create earnings transaction
        const { error: earningsError } = await supabase
          .from('earnings_transactions')
          .insert({
            user_id: stream.user_id,
            transaction_type: stream.stream_type,
            amount: earnings,
            points: dataPointCount,
            description: `${stream.stream_type} data collection: ${dataPointCount} data points - ${JSON.stringify(streamData)}`,
            reference_id: stream.id,
          });

        if (earningsError) {
          console.error(`Failed to create earnings transaction for stream ${stream.id}:`, earningsError);
          continue;
        }

        // Update user's total earnings
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            total_earnings: supabase.raw(`total_earnings + ${earnings}`),
          })
          .eq('user_id', stream.user_id);

        if (profileError) {
          console.error(`Failed to update profile earnings for user ${stream.user_id}:`, profileError);
        }

        results.push({
          user_id: stream.user_id,
          stream_type: stream.stream_type,
          data_points: dataPointCount,
          earnings,
          data: streamData,
          status: 'success',
        });

        console.log(`Successfully processed ${stream.stream_type} data for user ${stream.user_id}: ${dataPointCount} points, $${earnings.toFixed(4)} earned`);

      } catch (error) {
        console.error(`Error processing stream ${stream.id}:`, error);
        results.push({
          user_id: stream.user_id,
          stream_type: stream.stream_type,
          status: 'error',
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed other data streams for ${results.length} streams`,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Other data collection error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});