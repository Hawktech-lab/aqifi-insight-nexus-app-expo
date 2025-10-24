const { createClient } = require('@supabase/supabase-js');

// Debug email metadata collection issue
async function debugEmailMetadata() {
  console.log('🔍 Debugging Email Metadata Collection Issue...');
  
  // You'll need to replace these with your actual Supabase credentials
  const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';
  
  if (supabaseUrl === 'your-supabase-url' || supabaseKey === 'your-supabase-anon-key') {
    console.log('❌ Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Check if email_metadata table exists and is accessible
    console.log('📊 Checking email_metadata table...');
    const { data: tableData, error: tableError } = await supabase
      .from('email_metadata')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Error accessing email_metadata table:', tableError.message);
      return;
    }
    
    console.log('✅ email_metadata table is accessible');
    console.log('📋 Current records in email_metadata:', tableData?.length || 0);
    
    // Check earnings_transactions for email_metadata type
    console.log('💰 Checking earnings_transactions for email_metadata...');
    const { data: earningsData, error: earningsError } = await supabase
      .from('earnings_transactions')
      .select('*')
      .eq('transaction_type', 'email_metadata')
      .limit(5);
    
    if (earningsError) {
      console.log('❌ Error accessing earnings_transactions:', earningsError.message);
      return;
    }
    
    console.log('✅ Found', earningsData?.length || 0, 'email_metadata earnings transactions');
    
    if (earningsData && earningsData.length > 0) {
      console.log('📋 Sample earnings transaction:', earningsData[0]);
      
      // Try to parse the reference_id to see what email data was supposed to be stored
      try {
        const referenceData = JSON.parse(earningsData[0].reference_id);
        console.log('📧 Reference data from earnings transaction:', referenceData);
        
        // Check if this message_id exists in email_metadata table
        const { data: emailCheck, error: emailCheckError } = await supabase
          .from('email_metadata')
          .select('*')
          .eq('message_id', referenceData.message_id);
        
        if (emailCheckError) {
          console.log('❌ Error checking email_metadata for message_id:', emailCheckError.message);
        } else if (emailCheck && emailCheck.length > 0) {
          console.log('✅ Found corresponding email_metadata record:', emailCheck[0]);
        } else {
          console.log('❌ No corresponding email_metadata record found for message_id:', referenceData.message_id);
          console.log('🔍 This confirms the issue: earnings are created but email_metadata is not');
        }
      } catch (parseError) {
        console.log('❌ Error parsing reference_id:', parseError.message);
      }
    }
    
    // Test direct insertion to see if there are any database constraints
    console.log('🧪 Testing direct email_metadata insertion...');
    const testMessageId = `debug_test_${Date.now()}`;
    const testEmailData = [{
      user_id: 'test-user-id', // Replace with actual user ID
      message_id: testMessageId,
      from_address: 'debug@example.com',
      to_addresses: ['user@gmail.com'],
      subject: 'Debug Test Email',
      email_date: new Date().toISOString(),
      thread_id: 'debug_thread',
      labels: ['INBOX'],
      is_read: false,
      is_important: false,
      has_attachments: false,
      email_size: 1024,
      created_at: new Date().toISOString()
    }];

    const { data: insertData, error: insertError } = await supabase
      .from('email_metadata')
      .insert(testEmailData)
      .select();

    if (insertError) {
      console.log('❌ Direct insertion failed:', insertError.message);
      console.log('Error details:', insertError);
    } else {
      console.log('✅ Direct insertion successful:', insertData);
      
      // Clean up test data
      await supabase
        .from('email_metadata')
        .delete()
        .eq('message_id', testMessageId);
      console.log('🧹 Test data cleaned up');
    }
    
  } catch (error) {
    console.log('❌ Debug failed with error:', error.message);
    console.log('Error details:', error);
  }
}

// Run the debug
debugEmailMetadata();
