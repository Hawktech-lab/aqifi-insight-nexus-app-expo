import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  address?: string;
}

// Reverse geocoding to get address from coordinates
async function getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
  const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
  
  if (!googleMapsApiKey) {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsApiKey}`
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('Geocoding error:', error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

// Generate realistic location data for simulation
function generateSimulatedLocationData(): LocationData[] {
  const locations = [
    // Major cities with some variation
    { lat: 40.7128, lng: -74.0060, name: "New York" },
    { lat: 34.0522, lng: -118.2437, name: "Los Angeles" },
    { lat: 41.8781, lng: -87.6298, name: "Chicago" },
    { lat: 29.7604, lng: -95.3698, name: "Houston" },
    { lat: 33.4484, lng: -112.0740, name: "Phoenix" },
  ];

  const selectedLocation = locations[Math.floor(Math.random() * locations.length)];
  const locationCount = Math.floor(Math.random() * 5) + 1; // 1-5 location points
  
  const simulatedLocations: LocationData[] = [];
  
  for (let i = 0; i < locationCount; i++) {
    // Add small random variation around the base location
    const latVariation = (Math.random() - 0.5) * 0.01; // ~1km variation
    const lngVariation = (Math.random() - 0.5) * 0.01;
    
    simulatedLocations.push({
      latitude: selectedLocation.lat + latVariation,
      longitude: selectedLocation.lng + lngVariation,
      accuracy: Math.floor(Math.random() * 20) + 5, // 5-25 meter accuracy
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      address: `Near ${selectedLocation.name}`,
    });
  }
  
  return simulatedLocations.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting location data collection...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users with enabled location tracking
    const { data: users, error: usersError } = await supabase
      .from('data_streams')
      .select('user_id, id, earnings_rate')
      .eq('stream_type', 'location')
      .eq('is_enabled', true);

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    console.log(`Found ${users?.length || 0} users with location tracking enabled`);

    const results = [];

    for (const user of users || []) {
      try {
        // For now, we'll simulate location data
        // In production, this would integrate with location services APIs
        const locationData = generateSimulatedLocationData();
        
        console.log(`Generated ${locationData.length} location points for user ${user.user_id}`);

        // Update data stream with new data count
        const { error: updateError } = await supabase
          .from('data_streams')
          .update({
            data_count: locationData.length,
            last_sync_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) {
          console.error(`Failed to update data stream for user ${user.user_id}:`, updateError);
          continue;
        }

        // Calculate earnings based on location points
        const earnings = locationData.length * (user.earnings_rate || 0);
        
        // Create detailed location summary
        const locationSummary = locationData.map(loc => 
          `${loc.address || `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`} (${loc.accuracy}m accuracy)`
        ).join('; ');

        // Create earnings transaction
        const { error: earningsError } = await supabase
          .from('earnings_transactions')
          .insert({
            user_id: user.user_id,
            transaction_type: 'location_data',
            amount: earnings,
            points: locationData.length,
            description: `Location data collection: ${locationData.length} location points - ${locationSummary}`,
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
          location_points: locationData.length,
          earnings,
          locations: locationData,
          status: 'success',
        });

        console.log(`Successfully processed location data for user ${user.user_id}: ${locationData.length} points, $${earnings.toFixed(4)} earned`);

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
        message: `Processed location data for ${results.length} users`,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Location data collection error:', error);
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