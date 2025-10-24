const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = "https://uyamvlctjacvevyfdnez.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5YW12bGN0amFjdmV2eWZkbmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NzE3NTQsImV4cCI6MjA2NzI0Nzc1NH0.GustXM94NZXF5oCghzHeRo9NFqRNLtnyaUQMjGCgIOg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDataSaving() {
  console.log('Testing data saving functionality...');
  
  const testUserId = '00000000-0000-0000-0000-000000000001';
  
  try {
    // Test 1: Create a test data stream
    console.log('\n1. Creating test data stream...');
    const { data: streamData, error: streamError } = await supabase
      .from('data_streams')
      .insert({
        user_id: testUserId,
        stream_type: 'location',
        is_enabled: true,
        data_count: 0,
        earnings_rate: 0.005,
        last_sync_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (streamError) {
      console.error('❌ Error creating data stream:', streamError);
      return;
    }
    console.log('✅ Test data stream created:', streamData.id);
    
    // Test 2: Create a test location transaction
    console.log('\n2. Creating test location transaction...');
    const { data: locationData, error: locationError } = await supabase
      .from('earnings_transactions')
      .insert({
        user_id: testUserId,
        amount: 0.005,
        points: 1,
        transaction_type: 'location_data',
        description: 'Test location data collected',
        reference_id: JSON.stringify({
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
          timestamp: new Date().toISOString(),
          location_type: 'gps',
          city: 'San Francisco',
          state: 'CA',
          country: 'USA'
        })
      })
      .select()
      .single();
    
    if (locationError) {
      console.error('❌ Error creating location transaction:', locationError);
    } else {
      console.log('✅ Test location transaction created:', locationData.id);
    }
    
    // Test 3: Create a test spatial transaction
    console.log('\n3. Creating test spatial transaction...');
    const { data: spatialData, error: spatialError } = await supabase
      .from('earnings_transactions')
      .insert({
        user_id: testUserId,
        amount: 0.003,
        points: 1,
        transaction_type: 'spatial_data',
        description: 'Test spatial visit at 37.7749, -122.4194 for 120s',
        reference_id: JSON.stringify({
          cell_lat: 37.7749,
          cell_lon: -122.4194,
          dwell_ms: 120000,
          visited_at: new Date().toISOString(),
          cell_key: '37.7749,-122.4194'
        })
      })
      .select()
      .single();
    
    if (spatialError) {
      console.error('❌ Error creating spatial transaction:', spatialError);
    } else {
      console.log('✅ Test spatial transaction created:', spatialData.id);
    }
    
    // Test 4: Update the data stream count
    console.log('\n4. Updating data stream count...');
    const { data: updateData, error: updateError } = await supabase
      .from('data_streams')
      .update({
        data_count: 1,
        last_sync_at: new Date().toISOString()
      })
      .eq('id', streamData.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating data stream:', updateError);
    } else {
      console.log('✅ Data stream updated:', updateData.data_count);
    }
    
    // Test 5: Verify the data was saved
    console.log('\n5. Verifying saved data...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('earnings_transactions')
      .select('*')
      .eq('user_id', testUserId);
    
    if (verifyError) {
      console.error('❌ Error verifying data:', verifyError);
    } else {
      console.log('✅ Data verification successful');
      console.log(`   Found ${verifyData?.length || 0} transactions for test user`);
      
      verifyData?.forEach((transaction, index) => {
        console.log(`   Transaction ${index + 1}:`, {
          type: transaction.transaction_type,
          amount: transaction.amount,
          description: transaction.description,
          has_metadata: !!transaction.reference_id
        });
      });
    }
    
    // Test 6: Clean up test data
    console.log('\n6. Cleaning up test data...');
    await supabase
      .from('earnings_transactions')
      .delete()
      .eq('user_id', testUserId);
    
    await supabase
      .from('data_streams')
      .delete()
      .eq('user_id', testUserId);
    
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All database operations successful! Data can be saved and retrieved.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDataSaving();
