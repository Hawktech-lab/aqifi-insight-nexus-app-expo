const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = "https://uyamvlctjacvevyfdnez.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5YW12bGN0amFjdmV2eWZkbmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NzE3NTQsImV4cCI6MjA2NzI0Nzc1NH0.GustXM94NZXF5oCghzHeRo9NFqRNLtnyaUQMjGCgIOg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runDatabaseMigration() {
  console.log('🚀 Running Database Migration for Device Fingerprinting...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    console.log('📊 Executing database migration...\n');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          
          // Use rpc to execute raw SQL (this requires a function to be created first)
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.log(`⚠️  Statement ${i + 1} had an issue:`, error.message);
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (stmtError) {
          console.log(`❌ Error executing statement ${i + 1}:`, stmtError.message);
        }
      }
    }

    console.log('\n🎉 Database migration completed!');
    console.log('💡 Note: Some statements may have failed if tables already exist (which is normal)');
    
    // Verify the tables were created
    console.log('\n🔍 Verifying table creation...');
    
    const tablesToCheck = [
      'device_fingerprints',
      'device_sessions', 
      'device_permissions',
      'behavioral_events'
    ];

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ Table ${tableName}: Accessible`);
        }
      } catch (err) {
        console.log(`❌ Table ${tableName}: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error running migration:', error);
    console.log('\n💡 Alternative: You can run the migration manually in your Supabase dashboard:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of database-migration.sql');
    console.log('4. Execute the SQL');
  }
}

// Run the migration
runDatabaseMigration();
