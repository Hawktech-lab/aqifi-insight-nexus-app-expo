# Build Configuration Guide

## Build-Time vs Runtime Configuration

This app uses a two-tier configuration system:

1. **Build-Time Configuration** (Environment Variables)
   - Required for Expo plugins and native module setup
   - Set via environment variables during build
   - Not stored in codebase

2. **Runtime Configuration** (Database)
   - All sensitive values fetched from database at runtime
   - Managed via `app_configuration` table
   - No hardcoded values in code

## Required Environment Variables for Build

### Supabase Connection (Required)
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Google Sign-In Plugin (Optional but Recommended)
These are needed for the Google Sign-In native module configuration at build time. If not set, the plugin will be skipped, but OAuth will still work via database configuration at runtime.

```bash
EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps.CLIENT_ID_PREFIX
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=CLIENT_ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=CLIENT_ID.apps.googleusercontent.com
```

**Note:** The `iosUrlScheme` format is typically `com.googleusercontent.apps.{CLIENT_ID_PREFIX}` where CLIENT_ID_PREFIX is the first part of your Android Client ID before `.apps.googleusercontent.com`.

## Setting Environment Variables

### For EAS Build

#### Option 1: EAS Secrets (Recommended)
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "your-web-client-id"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "your-android-client-id"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME --value "com.googleusercontent.apps.your-prefix"
```

#### Option 2: eas.json
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key",
        "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID": "your-web-client-id",
        "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID": "your-android-client-id",
        "EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME": "com.googleusercontent.apps.your-prefix"
      }
    }
  }
}
```

### For Local Development

Create a `.env` file in the project root:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps.your-prefix
```

## Build Errors and Solutions

### Error: "Missing iosUrlScheme in provided options"

**Cause:** Google Sign-In plugin is included but environment variables are not set.

**Solution:** 
1. Set the required environment variables (see above)
2. Or the plugin will be automatically skipped if variables are not set (OAuth still works via database)

### Error: "cli.appVersionSource is not set"

**Solution:** Already fixed in `app.config.ts` - this field is now set to `'remote'`.

### Error: "Failed to read app config"

**Cause:** Usually related to missing environment variables or syntax errors in `app.config.ts`.

**Solution:** 
1. Verify all environment variables are set
2. Check `app.config.ts` syntax
3. Run `npx expo config` locally to test

## Runtime Configuration

After the app builds and runs, all sensitive configuration is fetched from the database:

- Google OAuth Client IDs → `app_configuration` table
- Gmail API Key → `app_configuration` table  
- ZkMe credentials → `app_configuration` table

See `SECURE_CONFIG_SETUP.md` for database configuration details.

## Important Notes

1. **Build-time values are NOT secrets** - They're used for native module configuration only
2. **Runtime values ARE secrets** - All fetched from database, never hardcoded
3. **Plugin is optional** - If Google Sign-In plugin env vars aren't set, OAuth still works via database config
4. **Environment variables are build-time only** - They don't contain runtime secrets

## Verification

After setting environment variables, verify the build works:

```bash
# Test config locally
npx expo config

# Build with EAS
eas build --platform android
eas build --platform ios
```

