# Environment Variables Setup

## Required Environment Variables

This application requires environment variables to be set for the initial Supabase connection. These are the **only** hardcoded values needed, and they are loaded from environment variables, not from code.

### Supabase Connection (Required)

These are needed for the initial database connection to fetch app configuration:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Google OAuth (Optional - for build-time plugin configuration)

These are optional and only used by Expo plugins at build time. The actual OAuth values are loaded from the database at runtime:

```bash
EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps.your-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

## Setting Environment Variables

### For Local Development

Create a `.env` file in the project root:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### For EAS Build

Set environment variables in your `eas.json` or via EAS CLI:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key-here"
```

Or add to `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key-here"
      }
    }
  }
}
```

## Important Notes

1. **No Hardcoded Secrets**: All sensitive configuration values (API keys, OAuth credentials, etc.) are stored in the database (`app_configuration` table), not in code.

2. **Supabase Connection Only**: The environment variables above are **only** for the initial Supabase connection. Once connected, all other configuration is fetched from the database.

3. **GitHub Security**: Since these values are in environment variables (not hardcoded), GitHub will not flag them as secrets.

4. **Database Configuration**: After the initial connection, update all configuration values in the `app_configuration` table in Supabase. See `SECURE_CONFIG_SETUP.md` for details.

## Error Handling

If the database is inaccessible or configuration cannot be loaded:

- The app will display a user-friendly error screen
- Users will be prompted to try again later
- No fallback values are used - the app requires database access to function

This ensures that:
- No secrets are exposed in the codebase
- Configuration is centrally managed
- Users get clear feedback when services are unavailable

