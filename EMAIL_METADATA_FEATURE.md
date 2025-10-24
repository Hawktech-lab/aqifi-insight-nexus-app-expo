# Email Metadata Collection Feature

## Overview

This feature adds email metadata collection capability to the Aqifi Insight Nexus app. It allows users to collect email headers (from, to, subject, date) without accessing email body content or attachments, earning 1 point per email collected.

## Features Implemented

### 1. Email Metadata Service (`src/services/EmailMetadataService.ts`)
- **Email Collection**: Collects email metadata without body content or attachments
- **Duplicate Prevention**: Uses message IDs to prevent duplicate point awards
- **Last Read Tracking**: Tracks the last processed email to avoid reprocessing
- **Local Storage**: Uses AsyncStorage to maintain state between app sessions
- **Database Integration**: Stores email metadata in Supabase database

### 2. Email Metadata Hook (`src/hooks/useEmailMetadata.ts`)
- **State Management**: Manages email collection state and statistics
- **Auto Collection**: Automatically collects emails every 5 minutes if enabled
- **Statistics**: Provides real-time email statistics (total, unread, points earned)
- **Error Handling**: Comprehensive error handling with user-friendly alerts

### 3. Activity Page Integration (`src/pages/Activity.tsx`)
- **Email Collection Section**: Dedicated section for email metadata collection
- **Real-time Stats**: Shows total emails collected and points earned
- **Manual Collection**: Button to manually trigger email collection
- **Visual Feedback**: Loading states and success/error messages

### 4. Settings Page Integration (`src/pages/Settings.tsx`)
- **Email Settings Tab**: New tab dedicated to email metadata settings
- **Collection Statistics**: Detailed statistics display
- **Privacy Information**: Clear explanation of what data is collected
- **Manual Controls**: Collect now and reset functionality

### 5. Database Schema (`supabase/migrations/20250120000000-add-email-metadata-table.sql`)
- **Email Metadata Table**: Stores email headers and metadata
- **Indexes**: Optimized for performance with proper indexing
- **Row Level Security**: Ensures users can only access their own data
- **Statistics Functions**: Database functions for email statistics

## Data Collected

The feature collects the following email metadata:
- **Message ID**: Unique identifier for the email
- **From Address**: Sender's email address
- **To Addresses**: Array of recipient email addresses
- **Subject**: Email subject line
- **Date**: When the email was sent
- **Thread ID**: Gmail thread ID for grouping related emails
- **Labels**: Gmail labels applied to the email
- **Read Status**: Whether the email has been read
- **Importance**: Whether the email is marked as important
- **Attachments**: Whether the email has attachments (boolean only)
- **Size**: Email size in bytes

## Privacy & Security

### What is NOT Collected:
- ❌ Email body content
- ❌ File attachments
- ❌ Email content or text
- ❌ Personal information beyond headers

### What IS Collected:
- ✅ Email headers only (from, to, subject, date)
- ✅ Metadata (read status, importance, size)
- ✅ Gmail labels and thread information

### Security Measures:
- 🔒 Row Level Security (RLS) in database
- 🔒 User-specific data isolation
- 🔒 Encrypted storage in Supabase
- 🔒 Message ID tracking prevents duplicates
- 🔒 Local storage for state management

## Points System

- **1 point per email** collected
- **Duplicate prevention** ensures each email is only counted once
- **Message ID tracking** prevents double-counting
- **Automatic point calculation** based on email count

## Usage

### For Users:
1. Navigate to **Settings** → **Email** tab
2. Review privacy information
3. Click **Collect Now** to manually collect emails
4. View statistics in the **Activity** page
5. Enable/disable in **Data Streams** settings

### For Developers:
1. Import the service: `import EmailMetadataService from '../services/EmailMetadataService'`
2. Use the hook: `const { collectEmailMetadata, stats } = useEmailMetadata()`
3. Access statistics: `emailStats.totalEmails`, `emailStats.pointsEarned`

## Database Migration

To set up the database tables, run the migration:

```sql
-- Run this in your Supabase SQL editor
-- File: supabase/migrations/20250120000000-add-email-metadata-table.sql
```

## API Integration

Currently, the service uses mock data for demonstration. To integrate with real email providers:

1. **Gmail API**: Replace `simulateEmailCollection()` with Gmail API calls
2. **OAuth Setup**: Implement OAuth2 for Gmail access
3. **Rate Limiting**: Add proper rate limiting for API calls
4. **Error Handling**: Enhanced error handling for API failures

## Configuration

### Environment Variables (for future Gmail API integration):
```env
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REDIRECT_URI=your_redirect_uri
```

### Service Configuration:
- **Collection Interval**: 5 minutes (configurable in hook)
- **Storage Limit**: 1000 processed message IDs (prevents storage bloat)
- **Points per Email**: 1 point (configurable in service)

## Testing

Run the test script to verify functionality:
```bash
node test-email-metadata.js
```

## Future Enhancements

1. **Real Gmail API Integration**: Replace mock data with actual Gmail API
2. **Multiple Email Providers**: Support for Outlook, Yahoo, etc.
3. **Advanced Filtering**: Filter emails by sender, subject, etc.
4. **Batch Processing**: Process multiple emails in batches
5. **Analytics Dashboard**: Detailed analytics and insights
6. **Export Functionality**: Export email metadata for users

## Troubleshooting

### Common Issues:
1. **No emails collected**: Check if email metadata stream is enabled
2. **Duplicate points**: Message ID tracking should prevent this
3. **Storage issues**: Check AsyncStorage permissions
4. **Database errors**: Verify Supabase connection and RLS policies

### Debug Mode:
Enable debug logging by setting `console.log` statements in the service.

## Support

For issues or questions about the email metadata feature:
1. Check the console logs for error messages
2. Verify database connection and permissions
3. Ensure proper AsyncStorage setup
4. Check Supabase RLS policies

---

**Note**: This feature is currently using mock data for demonstration purposes. Real Gmail API integration requires additional OAuth setup and API credentials.
