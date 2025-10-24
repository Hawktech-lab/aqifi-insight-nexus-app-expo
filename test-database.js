const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = "https://uyamvlctjacvevyfdnez.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5YW12bGN0amFjdmV2eWZkbmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NzE3NTQsImV4cCI6MjA2NzI0Nzc1NH0.GustXM94NZXF5oCghzHeRo9NFqRNLtnyaUQMjGCgIOg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabase() {
  console.log('Testing database connectivity...');
  
  try {
    // Test 1: Check if we can connect to the database
    console.log('\n1. Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('data_streams')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return;
    }
    console.log('✅ Database connection successful');
    
    // Test 2: Check data_streams table
    console.log('\n2. Checking data_streams table...');
    const { data: streams, error: streamsError } = await supabase
      .from('data_streams')
      .select('*')
      .limit(5);
    
    if (streamsError) {
      console.error('❌ Error reading data_streams:', streamsError);
    } else {
      console.log('✅ data_streams table accessible');
      console.log(`   Found ${streams?.length || 0} stream records`);
      if (streams && streams.length > 0) {
        console.log('   Sample stream:', {
          id: streams[0].id,
          user_id: streams[0].user_id,
          stream_type: streams[0].stream_type,
          is_enabled: streams[0].is_enabled,
          data_count: streams[0].data_count,
          earnings_rate: streams[0].earnings_rate
        });
      }
    }
    
    // Test 3: Check earnings_transactions table
    console.log('\n3. Checking earnings_transactions table...');
    const { data: transactions, error: transactionsError } = await supabase
      .from('earnings_transactions')
      .select('*')
      .limit(5);
    
    if (transactionsError) {
      console.error('❌ Error reading earnings_transactions:', transactionsError);
    } else {
      console.log('✅ earnings_transactions table accessible');
      console.log(`   Found ${transactions?.length || 0} transaction records`);
      if (transactions && transactions.length > 0) {
        console.log('   Sample transaction:', {
          id: transactions[0].id,
          user_id: transactions[0].user_id,
          transaction_type: transactions[0].transaction_type,
          amount: transactions[0].amount,
          points: transactions[0].points,
          description: transactions[0].description
        });
      }
    }
    
    // Test 4: Check for location and spatial data specifically
    console.log('\n4. Checking for location and spatial data...');
    const { data: locationData, error: locationError } = await supabase
      .from('earnings_transactions')
      .select('*')
      .in('transaction_type', ['location_data', 'spatial_data'])
      .limit(10);
    
    if (locationError) {
      console.error('❌ Error reading location/spatial data:', locationError);
    } else {
      console.log('✅ Location/spatial data query successful');
      console.log(`   Found ${locationData?.length || 0} location/spatial records`);
      
      if (locationData && locationData.length > 0) {
        const locationCount = locationData.filter(t => t.transaction_type === 'location_data').length;
        const spatialCount = locationData.filter(t => t.transaction_type === 'spatial_data').length;
        console.log(`   - Location data: ${locationCount} records`);
        console.log(`   - Spatial data: ${spatialCount} records`);
        
        // Show sample data
        const sample = locationData[0];
        console.log('   Sample record:', {
          transaction_type: sample.transaction_type,
          amount: sample.amount,
          description: sample.description,
          reference_id: sample.reference_id ? 'Has metadata' : 'No metadata'
        });
      }
    }
    
    console.log('\n✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDatabase();
