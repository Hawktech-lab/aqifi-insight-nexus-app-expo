# RLS Policy Fix for app_configuration

## Issue

The RLS policies were referencing `profiles.is_admin` which doesn't exist. The `profiles` table uses a `role` column instead.

## Fix Applied

Updated the RLS policies in `database-app-config-migration.sql` to use:
- `profiles.role = 'admin'` instead of `profiles.is_admin = true`

## Prerequisites

Before running the migration, ensure the `profiles` table has a `role` column:

```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
```

If you haven't run the admin role migration yet, you can:
1. Run `add-admin-role.sql` first, OR
2. Run the ALTER TABLE command above

## Updated Policies

The following policies have been fixed:

1. **"Admin full access to app configs"** on `app_configuration`
   - Now checks: `profiles.role = 'admin'`

2. **"Admin read access to app config history"** on `app_config_change_history`
   - Now checks: `profiles.role = 'admin'`

## Setting an Admin User

After ensuring the `role` column exists, set a user as admin:

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-admin-email@example.com');
```

## Verification

After running the migration, verify the policies work:

```sql
-- Check if policies exist
SELECT * FROM pg_policies WHERE tablename = 'app_configuration';

-- Test admin access (replace with your admin user_id)
SELECT * FROM app_configuration WHERE user_id = 'your-admin-user-id';
```

