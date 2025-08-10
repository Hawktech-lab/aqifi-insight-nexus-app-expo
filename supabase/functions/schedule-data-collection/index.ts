import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting scheduled data collection...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = [];

    // Collect activity data
    console.log('Triggering activity data collection...');
    const activityResponse = await supabase.functions.invoke('collect-activity-data');
    
    if (activityResponse.error) {
      console.error('Activity data collection error:', activityResponse.error);
      results.push({
        function: 'collect-activity-data',
        status: 'error',
        error: activityResponse.error.message,
      });
    } else {
      console.log('Activity data collection completed successfully');
      results.push({
        function: 'collect-activity-data',
        status: 'success',
        data: activityResponse.data,
      });
    }

    // Small delay between function calls
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Collect location data
    console.log('Triggering location data collection...');
    const locationResponse = await supabase.functions.invoke('collect-location-data');
    
    if (locationResponse.error) {
      console.error('Location data collection error:', locationResponse.error);
      results.push({
        function: 'collect-location-data',
        status: 'error',
        error: locationResponse.error.message,
      });
    } else {
      console.log('Location data collection completed successfully');
      results.push({
        function: 'collect-location-data',
        status: 'success',
        data: locationResponse.data,
      });
    }

    // Collect other data streams (device metadata, behavioral data, etc.)
    console.log('Triggering other data collection...');
    const otherDataResponse = await supabase.functions.invoke('collect-other-data');
    
    if (otherDataResponse.error) {
      console.error('Other data collection error:', otherDataResponse.error);
      results.push({
        function: 'collect-other-data',
        status: 'error',
        error: otherDataResponse.error.message,
      });
    } else {
      console.log('Other data collection completed successfully');
      results.push({
        function: 'collect-other-data',
        status: 'success',
        data: otherDataResponse.data,
      });
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scheduled data collection completed: ${successCount} success, ${errorCount} errors`,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Scheduled data collection error:', error);
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