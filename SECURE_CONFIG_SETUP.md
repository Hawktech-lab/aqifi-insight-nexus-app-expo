# Secure Configuration Setup Guide

## Overview

This application now uses a secure database-driven configuration system to store sensitive values like API keys, OAuth credentials, and third-party service keys. This approach provides better security by:

1. **Removing hardcoded secrets** from the codebase
2. **Centralized management** of configuration values
3. **Easy updates** without code changes or app rebuilds
4. **Audit trail** of configuration changes
5. **Fallback mechanism** ensures app continues working if database is unavailable

## Architecture

### Database Table: `app_configuration`

The `app_configuration` table stores all sensitive configuration values:

- **config_key**: Unique identifier for the configuration (e.g., `google_client_id`, `gmail_api_key`)
- **config_value**: The actual configuration value
- **config_category**: Category grouping (oauth, api_keys, third_party, supabase, zkme)
- **is_active**: Whether the configuration is currently active
- **is_encrypted**: Flag for future encryption support

### Service: `AppConfigurationService`

The `AppConfigurationService` singleton handles:
- Fetching configuration from database
- Caching configuration (10-minute cache)
- Fallback to hardcoded values if database fetch fails
- Offline support via AsyncStorage

## Setup Instructions

### Step 1: Run Database Migration

1. Open your Supabase SQL Editor
2. Run the migration file: `database-app-config-migration.sql`
3. Verify the `app_configuration` table was created

### Step 2: Update Configuration Values

After running the migration, update the configuration values in the database:

```sql
-- Example: Update Google Client ID
UPDATE app_configuration 
SET config_value = 'your-actual-google-client-id'
WHERE config_key = 'google_client_id';

-- Example: Update Gmail API Key
UPDATE app_configuration 
SET config_value = 'your-actual-gmail-api-key'
WHERE config_key = 'gmail_api_key';

-- Example: Update ZkMe credentials
UPDATE app_configuration 
SET config_value = 'your-actual-zkme-mch-no'
WHERE config_key = 'zkme_mch_no';

UPDATE app_configuration 
SET config_value = 'your-actual-zkme-api-key'
WHERE config_key = 'zkme_api_key';
```

### Step 3: Verify Configuration

The app will automatically fetch configuration from the database on startup. You can verify it's working by:

1. Check app logs for any configuration fetch errors
2. The app should use database values if available
3. If database fetch fails, it falls back to `app.config.ts` values

## Configuration Keys Reference

| Key | Category | Description |
|-----|----------|-------------|
| `supabase_url` | supabase | Supabase project URL |
| `supabase_anon_key` | supabase | Supabase anonymous key |
| `google_client_id` | oauth | Google OAuth Client ID (Android/iOS) |
| `google_client_id_web` | oauth | Google OAuth Client ID (Web) |
| `google_client_id_android` | oauth | Google OAuth Client ID (Android) |
| `google_client_id_ios` | oauth | Google OAuth Client ID (iOS) |
| `gmail_api_key` | api_keys | Gmail API Key |
| `zkme_mch_no` | zkme | ZkMe Merchant Number (Program No) |
| `zkme_api_key` | zkme | ZkMe API Key |

## Usage in Code

### Basic Usage

```typescript
import AppConfigurationService from './services/AppConfigurationService';

// Get all configurations
const configs = await AppConfigurationService.getInstance().getAppConfigs();

// Get specific value
const apiKey = await AppConfigurationService.getInstance().getConfigValue('gmail_api_key');

// Get by category
const oauthConfigs = await AppConfigurationService.getInstance().getConfigsByCategory('oauth');

// Get Google OAuth config (convenience method)
const googleConfig = await AppConfigurationService.getInstance().getGoogleOAuthConfig();

// Get ZkMe config (convenience method)
const zkmeConfig = await AppConfigurationService.getInstance().getZkMeConfig();
```

### Service Integration

Services have been updated to use `AppConfigurationService`:

- ✅ `RealGmailAuthService` - Uses database for Google OAuth and Gmail API keys
- ✅ `zkmeApi.ts` - Uses database for ZkMe credentials
- ✅ `ZkMeWebView` components - Use database for ZkMe config

## Security Considerations

### Row Level Security (RLS)

The `app_configuration` table has RLS enabled:
- **Public read access**: All authenticated users can read active configurations
- **Admin write access**: Only admins can update configurations

### Best Practices

1. **Never commit sensitive values** to version control
2. **Use environment variables** for local development fallbacks
3. **Rotate keys regularly** by updating database values
4. **Monitor configuration changes** via `app_config_change_history` table
5. **Use encryption** for highly sensitive values (future enhancement)

## Fallback Mechanism

The app uses a three-tier fallback system:

1. **Database** (primary) - Fetched from `app_configuration` table
2. **AsyncStorage** (secondary) - Cached values from previous database fetch
3. **app.config.ts** (tertiary) - Hardcoded fallback values

This ensures the app continues working even if:
- Database is temporarily unavailable
- Network connection is lost
- Configuration service is down

## Troubleshooting

### Configuration Not Loading

1. Check database connection
2. Verify RLS policies allow read access
3. Check app logs for fetch errors
4. Verify `is_active = true` for configuration rows

### Using Fallback Values

If you see warnings about using fallback values:
- Check database connectivity
- Verify configuration exists in database
- Check RLS policies

### Updating Configuration

To update configuration values:

1. **Via SQL** (recommended for admins):
```sql
UPDATE app_configuration 
SET config_value = 'new-value', updated_at = NOW()
WHERE config_key = 'your_key';
```

2. **Via Admin UI** (if implemented):
   - Use the admin configuration page
   - Changes are automatically logged in `app_config_change_history`

## Migration Notes

- **Backward Compatible**: Existing code continues to work with fallback values
- **No Breaking Changes**: All services gracefully handle database fetch failures
- **Gradual Migration**: You can migrate services one at a time

## Future Enhancements

- [ ] Encryption support for sensitive values
- [ ] Configuration versioning
- [ ] Admin UI for configuration management
- [ ] Configuration validation rules
- [ ] Environment-specific configurations (dev/staging/prod)

