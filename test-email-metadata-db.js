const { createClient } = require('@supabase/supabase-js');

// Test email metadata database insertion
async function testEmailMetadataInsertion() {
  console.log('🧪 Testing Email Metadata Database Insertion...');
  
  // You'll need to replace these with your actual Supabase credentials
  const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';
  
  if (supabaseUrl === 'your-supabase-url' || supabaseKey === 'your-supabase-anon-key') {
    console.log('❌ Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test data
    const testEmailData = [{
      user_id: 'test-user-id', // Replace with actual user ID
      message_id: `test_${Date.now()}`,
      from_address: 'test@example.com',
      to_addresses: ['user@gmail.com'],
      subject: 'Test Email',
      email_date: new Date().toISOString(),
      thread_id: 'test_thread',
      labels: ['INBOX'],
      is_read: false,
      is_important: false,
      has_attachments: false,
      email_size: 1024,
      created_at: new Date().toISOString()
    }];

    console.log('📧 Inserting test email metadata...');
    
    // Insert test data
    const { data: insertData, error: insertError } = await supabase
      .from('email_metadata')
      .insert(testEmailData)
      .select();

    if (insertError) {
      console.log('❌ Insertion failed:', insertError.message);
      console.log('Error details:', insertError);
      return;
    }

    if (!insertData || insertData.length === 0) {
      console.log('❌ No data returned from insertion');
      return;
    }

    console.log('✅ Insertion successful!');
    console.log('📊 Inserted data:', insertData);

    // Verify the data was inserted
    const { data: verifyData, error: verifyError } = await supabase
      .from('email_metadata')
      .select('*')
      .eq('message_id', testEmailData[0].message_id);

    if (verifyError) {
      console.log('❌ Verification failed:', verifyError.message);
      return;
    }

    if (verifyData && verifyData.length > 0) {
    console.log('✅ Verification successful!');
    console.log('📋 Retrieved data:', verifyData[0]);
  } else {
    console.log('❌ No data found during verification');
  }

  // Test earnings transaction creation
  console.log('💰 Testing earnings transaction creation...');
  const earningsRate = 0.01;
  const testEarningsTransaction = {
    user_id: 'test-user-id',
    amount: earningsRate,
    points: 1,
    transaction_type: 'email_metadata',
    description: 'Test Email metadata collected: Test Email from test@example.com',
    reference_id: JSON.stringify({
      message_id: testEmailData[0].message_id,
      from: 'test@example.com',
      subject: 'Test Email',
      email_date: testEmailData[0].email_date,
      thread_id: 'test_thread',
      is_read: false,
      is_important: false,
      has_attachments: false,
      email_size: 1024,
      labels: ['INBOX']
    })
  };

  const { data: earningsData, error: earningsError } = await supabase
    .from('earnings_transactions')
    .insert([testEarningsTransaction])
    .select();

  if (earningsError) {
    console.log('❌ Earnings transaction creation failed:', earningsError.message);
  } else if (!earningsData || earningsData.length === 0) {
    console.log('❌ No earnings data returned from insertion');
  } else {
    console.log('✅ Earnings transaction creation successful!');
    console.log('💰 Created earnings transaction:', earningsData[0]);
  }

  // Clean up test data
  console.log('🧹 Cleaning up test data...');
  const { error: deleteError } = await supabase
    .from('email_metadata')
    .delete()
    .eq('message_id', testEmailData[0].message_id);

  if (deleteError) {
    console.log('⚠️ Email metadata cleanup failed:', deleteError.message);
  } else {
    console.log('✅ Email metadata cleanup successful!');
  }

  // Clean up earnings transaction
  if (earningsData && earningsData.length > 0) {
    const { error: earningsDeleteError } = await supabase
      .from('earnings_transactions')
      .delete()
      .eq('reference_id', testEarningsTransaction.reference_id);

    if (earningsDeleteError) {
      console.log('⚠️ Earnings transaction cleanup failed:', earningsDeleteError.message);
    } else {
      console.log('✅ Earnings transaction cleanup successful!');
    }
  }

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    console.log('Error details:', error);
  }
}

// Run the test
testEmailMetadataInsertion();
