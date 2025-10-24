const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = "https://uyamvlctjacvevyfdnez.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5YW12bGN0amFjdmV2eWZkbmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NzE3NTQsImV4cCI6MjA2NzI0Nzc1NH0.GustXM94NZXF5oCghzHeRo9NFqRNLtnyaUQMjGCgIOg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDeviceFingerprintingDatabase() {
  console.log('🔍 Checking Device Fingerprinting Database...\n');

  try {
    // Check if device_fingerprints table exists and has data
    console.log('📊 Checking device_fingerprints table...');
    const { data: fingerprints, error: fingerprintsError } = await supabase
      .from('device_fingerprints')
      .select('*')
      .limit(5);

    if (fingerprintsError) {
      console.log('❌ Error accessing device_fingerprints table:', fingerprintsError.message);
      console.log('💡 This might mean the table doesn\'t exist yet or there are permission issues');
    } else {
      console.log(`✅ device_fingerprints table accessible`);
      console.log(`📈 Found ${fingerprints?.length || 0} device fingerprint records`);
      
      if (fingerprints && fingerprints.length > 0) {
        console.log('\n📱 Sample Device Fingerprint Data:');
        const sample = fingerprints[0];
        console.log('- Device ID:', sample.device_id);
        console.log('- Device Name:', sample.device_name);
        console.log('- OS Type:', sample.os_type);
        console.log('- OS Version:', sample.os_version);
        console.log('- App Version:', sample.app_version);
        console.log('- Created At:', sample.created_at);
        console.log('- Updated At:', sample.updated_at);
      }
    }

    // Check device_sessions table
    console.log('\n📊 Checking device_sessions table...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('device_sessions')
      .select('*')
      .limit(5);

    if (sessionsError) {
      console.log('❌ Error accessing device_sessions table:', sessionsError.message);
    } else {
      console.log(`✅ device_sessions table accessible`);
      console.log(`📈 Found ${sessions?.length || 0} device session records`);
      
      if (sessions && sessions.length > 0) {
        console.log('\n🔄 Sample Device Session Data:');
        const sample = sessions[0];
        console.log('- Session Token:', sample.session_token);
        console.log('- Started At:', sample.session_started_at);
        console.log('- User Agent:', sample.user_agent);
        console.log('- Created At:', sample.created_at);
      }
    }

    // Check device_permissions table
    console.log('\n📊 Checking device_permissions table...');
    const { data: permissions, error: permissionsError } = await supabase
      .from('device_permissions')
      .select('*')
      .limit(5);

    if (permissionsError) {
      console.log('❌ Error accessing device_permissions table:', permissionsError.message);
    } else {
      console.log(`✅ device_permissions table accessible`);
      console.log(`📈 Found ${permissions?.length || 0} device permission records`);
      
      if (permissions && permissions.length > 0) {
        console.log('\n🔐 Sample Device Permission Data:');
        const sample = permissions[0];
        console.log('- Permission Type:', sample.permission_type);
        console.log('- Is Granted:', sample.is_granted);
        console.log('- Consent Version:', sample.consent_version);
        console.log('- Granted At:', sample.granted_at);
        console.log('- Created At:', sample.created_at);
      }
    }

    // Check behavioral_events table for device fingerprinting events
    console.log('\n📊 Checking behavioral_events table for device fingerprinting events...');
    const { data: events, error: eventsError } = await supabase
      .from('behavioral_events')
      .select('*')
      .or('event_type.eq.device_fingerprinting_initialized,event_type.eq.app_lifecycle,event_type.eq.screen_view,event_type.eq.auth_state_change')
      .limit(10);

    if (eventsError) {
      console.log('❌ Error accessing behavioral_events table:', eventsError.message);
    } else {
      console.log(`✅ behavioral_events table accessible`);
      console.log(`📈 Found ${events?.length || 0} device fingerprinting events`);
      
      if (events && events.length > 0) {
        console.log('\n📈 Sample Device Fingerprinting Events:');
        events.forEach((event, index) => {
          console.log(`${index + 1}. Event Type: ${event.event_type}`);
          console.log(`   Data:`, JSON.stringify(event.event_data, null, 2));
          console.log(`   Created At: ${event.created_at}`);
          console.log('');
        });
      }
    }

    // Summary
    console.log('\n📋 Database Check Summary:');
    console.log('✅ Supabase connection successful');
    console.log(`📊 Device Fingerprints: ${fingerprints?.length || 0} records`);
    console.log(`🔄 Device Sessions: ${sessions?.length || 0} records`);
    console.log(`🔐 Device Permissions: ${permissions?.length || 0} records`);
    console.log(`📈 Device Events: ${events?.length || 0} records`);

    if ((fingerprints?.length || 0) > 0) {
      console.log('\n🎉 SUCCESS: Device fingerprinting is working and storing data!');
    } else {
      console.log('\n⚠️  WARNING: No device fingerprinting data found');
      console.log('💡 This could mean:');
      console.log('   - The app hasn\'t been used yet');
      console.log('   - No users have authenticated');
      console.log('   - Database tables need to be created');
      console.log('   - There are permission issues');
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

// Run the check
checkDeviceFingerprintingDatabase();
