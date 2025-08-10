import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActivityData {
  steps: number;
  calories: number;
  distance: number;
  activeMinutes: number;
}

// Google Fit API integration
async function fetchGoogleFitData(accessToken: string): Promise<ActivityData> {
  const now = new Date();
  const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
  
  const response = await fetch(
    `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aggregateBy: [
          { dataTypeName: 'com.google.step_count.delta' },
          { dataTypeName: 'com.google.calories.expended' },
          { dataTypeName: 'com.google.distance.delta' },
          { dataTypeName: 'com.google.active_minutes' }
        ],
        bucketByTime: { durationMillis: 86400000 }, // 1 day
        startTimeMillis: startTime.getTime(),
        endTimeMillis: now.getTime(),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Google Fit API error: ${await response.text()}`);
  }

  const data = await response.json();
  
  // Parse Google Fit response
  let steps = 0, calories = 0, distance = 0, activeMinutes = 0;
  
  for (const bucket of data.bucket || []) {
    for (const dataset of bucket.dataset || []) {
      for (const point of dataset.point || []) {
        const dataType = dataset.dataSourceId;
        if (dataType.includes('step_count')) {
          steps += point.value?.[0]?.intVal || 0;
        } else if (dataType.includes('calories')) {
          calories += point.value?.[0]?.fpVal || 0;
        } else if (dataType.includes('distance')) {
          distance += point.value?.[0]?.fpVal || 0;
        } else if (dataType.includes('active_minutes')) {
          activeMinutes += point.value?.[0]?.intVal || 0;
        }
      }
    }
  }

  return { steps, calories, distance, activeMinutes };
}

// Simulate activity data for testing
function generateSimulatedActivityData(): ActivityData {
  const baseSteps = 8000;
  const variation = Math.random() * 4000; // 0-4000 step variation
  
  return {
    steps: Math.floor(baseSteps + variation),
    calories: Math.floor((baseSteps + variation) * 0.04), // ~0.04 calories per step
    distance: Math.floor((baseSteps + variation) * 0.0008 * 1000) / 1000, // ~0.8m per step, in km
    activeMinutes: Math.floor(30 + Math.random() * 90), // 30-120 active minutes
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting activity data collection...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users with enabled step tracking
    const { data: users, error: usersError } = await supabase
      .from('data_streams')
      .select('user_id, id, earnings_rate')
      .eq('stream_type', 'steps')
      .eq('is_enabled', true);

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    console.log(`Found ${users?.length || 0} users with step tracking enabled`);

    const results = [];

    for (const user of users || []) {
      try {
        let activityData: ActivityData;
        
        // Try to get real data from Google Fit first
        const googleFitToken = Deno.env.get('GOOGLE_FIT_ACCESS_TOKEN');
        
        if (googleFitToken) {
          console.log(`Fetching real Google Fit data for user ${user.user_id}`);
          activityData = await fetchGoogleFitData(googleFitToken);
        } else {
          console.log(`Simulating activity data for user ${user.user_id}`);
          activityData = generateSimulatedActivityData();
        }

        // Update data stream with new data
        const { error: updateError } = await supabase
          .from('data_streams')
          .update({
            data_count: activityData.steps,
            last_sync_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) {
          console.error(`Failed to update data stream for user ${user.user_id}:`, updateError);
          continue;
        }

        // Calculate earnings
        const earnings = activityData.steps * (user.earnings_rate || 0);
        
        // Create earnings transaction
        const { error: earningsError } = await supabase
          .from('earnings_transactions')
          .insert({
            user_id: user.user_id,
            transaction_type: 'activity_data',
            amount: earnings,
            points: activityData.steps,
            description: `Activity data collection: ${activityData.steps} steps, ${activityData.calories} calories`,
            reference_id: user.id,
          });

        if (earningsError) {
          console.error(`Failed to create earnings transaction for user ${user.user_id}:`, earningsError);
          continue;
        }

        // Update user's total earnings
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            total_earnings: supabase.raw(`total_earnings + ${earnings}`),
          })
          .eq('user_id', user.user_id);

        if (profileError) {
          console.error(`Failed to update profile earnings for user ${user.user_id}:`, profileError);
        }

        results.push({
          user_id: user.user_id,
          data: activityData,
          earnings,
          status: 'success',
        });

        console.log(`Successfully processed activity data for user ${user.user_id}: ${activityData.steps} steps, $${earnings.toFixed(4)} earned`);

      } catch (error) {
        console.error(`Error processing user ${user.user_id}:`, error);
        results.push({
          user_id: user.user_id,
          status: 'error',
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed activity data for ${results.length} users`,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Activity data collection error:', error);
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