# Location Data Stream Setup Guide

## 🚀 Quick Setup Steps

### 1. Database Setup
Run the database migration in your Supabase SQL editor:
```sql
-- Copy and paste the contents of database-migration.sql
-- This will create the required tables and set up permissions
```

### 2. Install Required Dependencies
Make sure you have the required packages installed:
```bash
npx expo install expo-location
```

### 3. App Configuration
The location stream is now automatically initialized when users first access the app. Here's what happens:

1. **First Login**: Data streams are automatically created for new users
2. **Settings Access**: Go to Settings → Data Streams
3. **Enable Location**: Toggle the "Location Data" stream to ON
4. **Permission Grant**: Allow location permissions when prompted
5. **Start Earning**: Location data collection begins automatically

## 📱 How to Enable Location Stream

### For Users:
1. Open the app and log in
2. Go to **Settings** tab
3. Navigate to **Data Streams** section
4. Find **"Location Data"** in the list
5. Toggle the switch to **ON**
6. Grant location permissions when prompted
7. Location tracking will start automatically

### For Developers:
The location stream is automatically initialized when:
- User logs in for the first time
- User accesses the data streams section
- The `useDataStreams` hook runs

## 🔧 Configuration Options

### Location Tracking Settings:
- **Update Interval**: 5 minutes (configurable)
- **Distance Filter**: 100 meters (configurable)
- **Accuracy**: Balanced GPS accuracy
- **Background Updates**: Disabled by default

### Earnings Rate:
- **Location Data**: $0.005 per data point
- **Data Points**: Each location update counts as 1 point
- **Real-time Updates**: Earnings calculated automatically

## 📊 What Data is Collected

### Location Information:
- GPS coordinates (latitude, longitude)
- Accuracy level
- Altitude (when available)
- Speed (when available)
- Direction/heading (when available)
- Timestamp

### Address Information:
- Street address
- City
- State/Region
- Country
- Postal code

## 🔒 Privacy & Security

### Data Protection:
- All data is stored securely in Supabase
- Row Level Security (RLS) ensures users only see their own data
- No personal information beyond location coordinates
- Users have full control over enabling/disabling

### Permissions:
- Foreground location permission required
- Background permission optional
- Users can revoke permissions anytime

## 🐛 Troubleshooting

### Common Issues:

1. **"Permission Required" Status**
   - Solution: Grant location permissions in device settings
   - Go to Settings → Privacy → Location Services → Your App

2. **"Location tracking not starting"**
   - Check if location services are enabled on device
   - Ensure app has location permissions
   - Restart the app

3. **"No data being collected"**
   - Verify location stream is enabled in Settings
   - Check if location permissions are granted
   - Ensure device has GPS signal

4. **"Database errors"**
   - Run the database migration script
   - Check Supabase connection
   - Verify RLS policies are in place

### Debug Information:
- Check console logs for detailed error messages
- Location service logs start with "LocationDataService"
- Data stream updates are logged automatically

## 📈 Monitoring & Analytics

### Track Events:
- `location_service_initialized`
- `location_tracking_started`
- `location_tracking_stopped`
- `location_stream_enabled`
- `location_stream_disabled`
- `location_config_updated`

### Data Metrics:
- Data points collected
- Earnings generated
- Last sync timestamp
- Tracking status

## 🎯 Next Steps

After location stream is working:
1. Test with different devices
2. Monitor data collection
3. Verify earnings calculations
4. Implement additional data streams (steps, WiFi, etc.)

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review console logs for error messages
3. Verify database setup is complete
4. Test with a fresh user account
