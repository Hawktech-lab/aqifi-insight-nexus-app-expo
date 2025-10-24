# Database Migration Instructions for Device Fingerprinting

## 🚀 Manual Migration Steps

Since the automated migration script cannot execute raw SQL through the Supabase client, you need to run the migration manually in your Supabase dashboard.

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `uyamvlctjacvevyfdnez`

### Step 2: Navigate to SQL Editor
1. In your project dashboard, click on "SQL Editor" in the left sidebar
2. Click "New query" to create a new SQL query

### Step 3: Run the Migration
1. Copy the entire contents of `database-migration.sql` file
2. Paste it into the SQL Editor
3. Click "Run" to execute the migration

### Step 4: Verify Migration
After running the migration, you can verify it worked by running the check script:

```bash
node check-device-fingerprinting-db.js
```

## 📊 What the Migration Creates

The migration will create the following tables:

1. **device_fingerprints** - Stores comprehensive device information
2. **device_sessions** - Tracks user sessions and activity
3. **device_permissions** - Manages user consent and permissions
4. **behavioral_events** - Stores analytics and tracking events

## 🔍 Verification

After running the migration, you should see:
- ✅ All tables accessible
- 📊 Sample data when users interact with the app
- 🔄 Automatic data collection working

## 🚨 Troubleshooting

If you encounter issues:

1. **Permission Errors**: Make sure you're using the correct Supabase project
2. **Table Already Exists**: This is normal - the migration uses `CREATE TABLE IF NOT EXISTS`
3. **RLS Policies**: The migration creates Row Level Security policies for data protection

## 📱 Testing Device Fingerprinting

Once the migration is complete:

1. Run the app: `npm start` or `expo start`
2. Sign in with a user account
3. Navigate through different screens
4. Check the database again: `node check-device-fingerprinting-db.js`

You should now see device fingerprinting data being collected automatically!
