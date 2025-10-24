import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'; // Import core React Native components
// For icons, you'll typically use a library like 'react-native-vector-icons'.
// Make sure to install and link it: npm install react-native-vector-icons
// For Lucide, there might be a community port or you'll need to use SVG support.
// For simplicity, I'll use placeholders or suggest react-native-vector-icons equivalents.
// If you specifically need Lucide, you might look into 'lucide-react-native' or 'react-native-svg' for custom icons.

// Placeholder for Lucide icons for demonstration.
// In a real app, you'd replace these with actual React Native icon components.
import { Heart, Smartphone, Wifi, MapPin, Mail, Zap, Navigation, RefreshCw, LocateIcon, Settings } from "lucide-react-native"; // Assuming a lucide-react-native exists or similar
import { Activity as ActivityIcon } from "lucide-react-native";


// For Card, Progress, Button, Badge - you'll need to create these as custom Nativewind components
// or use simple Views/Texts with Nativewind classes.
// Here, I'll use basic View/Text components and apply styles directly.
import { useDataStreams } from '../hooks/useDataStreams';
import { useLocationData } from '../hooks/useLocationData';
import { useDeviceFingerprinting } from '../contexts/DeviceFingerprintingContext';
import { useEmailMetadata } from '../hooks/useEmailMetadata';
import { useEmailAutoCollection } from '../hooks/useEmailAutoCollection';
import { useAuth } from '../contexts/AuthContext';
import { useGmailAuth } from '../hooks/useGmailAuth';
// import { styled } from 'nativewind'; // For applying Tailwind classes

// Styled components using Nativewind
const StyledView = View;
const StyledText = Text;
const StyledTouchableOpacity = TouchableOpacity;

// Define your custom components for Card, Button, Badge, etc.
// These are simplified examples; you'd build more robust components in a real app.

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = ({ children, className }: CardProps) => (
  <StyledView className={`rounded-lg bg-white shadow-md ${className}`}>
    {children}
  </StyledView>
);

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}
const CardHeader = ({ children, className }: CardHeaderProps) => (
  <StyledView className={`p-4 pb-0 ${className}`}>
    {children}
  </StyledView>
);

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}
const CardTitle = ({ children, className }: CardTitleProps) => (
  <StyledText className={`text-lg font-semibold ${className}`}>
    {children}
  </StyledText>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}
const CardContent = ({ children, className }: CardContentProps) => (
  <StyledView className={`p-4 pt-3 ${className}`}>
    {children}
  </StyledView>
);

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'outline' | 'default';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}
const Button = ({ children, onClick, disabled, variant = 'default', size = 'default', className }: ButtonProps) => {
  let buttonClasses = `px-4 py-2 rounded-lg flex-row items-center justify-center `;
  let textClasses = `text-white`;

  if (variant === 'outline') {
    buttonClasses += `border border-gray-300 bg-white`;
    textClasses = `text-gray-700`;
  } else { // default
    buttonClasses += `bg-blue-500`;
    textClasses = `text-white`;
  }

  if (size === 'sm') {
    buttonClasses += ` h-8 px-3 text-sm`;
  } else if (size === 'lg') {
    buttonClasses += ` h-12 px-8 text-lg`;
  } else { // default
    buttonClasses += ` h-10 px-4`;
  }

  if (disabled) {
    buttonClasses += ` opacity-50`;
  }

  return (
    <StyledTouchableOpacity
      onPress={onClick}
      disabled={disabled}
      className={`${buttonClasses} ${className}`}
    >
      {typeof children === 'string' ? (
        <StyledText className={`${textClasses}`}>{children}</StyledText>
      ) : (
        children
      )}
    </StyledTouchableOpacity>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  className?: string;
}
const Badge = ({ children, variant = 'default', className }: BadgeProps) => {
  let badgeClasses = `px-2.5 py-0.5 rounded-full text-xs font-semibold `;
  let textClasses = `text-white`;

  if (variant === 'outline') {
    badgeClasses += `border border-gray-300 bg-white`;
    textClasses = `text-gray-700`;
  } else if (variant === 'secondary') {
    badgeClasses += `bg-gray-200`;
    textClasses = `text-gray-800`;
  } else if (variant === 'destructive') {
    badgeClasses += `bg-red-500`;
    textClasses = `text-white`;
  } else { // default
    badgeClasses += `bg-blue-500`;
    textClasses = `text-white`;
  }

  return (
    <StyledView className={`${badgeClasses} ${className}`}>
      {typeof children === 'string' ? (
        <StyledText className={`${textClasses}`}>{children}</StyledText>
      ) : (
        children
      )}
    </StyledView>
  );
};

// Note: Progress component is more complex in RN. For simplicity,
// I'm omitting a full Progress component implementation here.
// You might use react-native-progress or build your own.

const streamIcons = {
  // steps: Heart, // COMMENTED OUT - Steps & Activity Tracking
  // device_metadata: Smartphone, // COMMENTED OUT - Device Information
  email_metadata: Mail, // ENABLED - Email Metadata Collection
  // wifi: Wifi, // COMMENTED OUT - WiFi Network Sharing
  spatial: Navigation,
  location: MapPin,
  behavioral: Zap,
};

const streamNames = {
  // steps: "Steps & Activity", // COMMENTED OUT - Steps & Activity Tracking
  // device_metadata: "Device Metadata", // COMMENTED OUT - Device Information
  email_metadata: "Email Metadata", // ENABLED - Email Metadata Collection
  // wifi: "WiFi Sharing", // COMMENTED OUT - WiFi Network Sharing
  spatial: "Spatial Data",
  location: "Location Data",
  behavioral: "Behavioral Data",
};

export default function Activity() {
  const { user } = useAuth();
  const { dataStreams, loading: streamsLoading, refreshDataStreams } = useDataStreams();
  const { 
    isInitialized: locationInitialized, 
    isTracking, 
    currentLocation, 
    locationHistory, 
    locationStream,
    getCurrentLocation,
    getLocationHistory,
    isEnabled: locationEnabled,
    dataCount: locationDataCount,
    earningsRate: locationEarningsRate,
    lastSync: locationLastSync
  } = useLocationData();
  const { trackEvent } = useDeviceFingerprinting();
  const { 
    isCollecting: emailCollecting,
    stats: emailStats,
    collectEmailMetadata,
    fetchStats: fetchEmailStats
  } = useEmailMetadata();
  const {
    isSignedIn: gmailSignedIn,
    isSigningIn: gmailSigningIn,
    user: gmailUser,
    signIn: gmailSignIn,
    signOut: gmailSignOut
  } = useGmailAuth();
  const {
    status: autoCollectionStatus,
    startAutoCollection,
    stopAutoCollection,
    forceCollection,
    handleReauth,
    isGmailUser: autoCollectionGmailUser
  } = useEmailAutoCollection();
  
  // Check if user is logged in with Gmail
  const isGmailUser = user?.email?.endsWith('@gmail.com') || false;
  
  const [refreshing, setRefreshing] = useState(false);
  const loading = streamsLoading;

  // Track activity view
  // useEffect(() => { // COMMENTED OUT - Device Fingerprinting Tracking
  //   if (trackEvent) {
  //     trackEvent('activity_page_viewed');
  //   }
  // }, [trackEvent]);

  // Ensure email_metadata stream exists for Gmail users
  useEffect(() => {
    if (user && isGmailUser && refreshDataStreams) {
      refreshDataStreams();
    }
  }, [user, isGmailUser, refreshDataStreams]);

  const refreshData = async () => {
    setRefreshing(true);
    
    // Refresh data streams to ensure email_metadata stream exists for Gmail users
    if (refreshDataStreams) {
      await refreshDataStreams();
    }
    
    // Also refresh email metadata stats
    await fetchEmailStats();
    
    setRefreshing(false);
  };

  if (loading) {
    return (
      <StyledView className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#0000ff" />
        <StyledText className="text-xl font-bold mt-4">
          Loading...
        </StyledText>
      </StyledView>
    );
  }

  const visibleStreams = dataStreams.filter(
    stream =>
      // stream.stream_type !== 'device_metadata' && // COMMENTED OUT - Device Information
      // stream.stream_type !== 'wifi' && // COMMENTED OUT - WiFi Network Sharing
      // stream.stream_type !== 'steps' && // COMMENTED OUT - Steps & Activity Tracking
      (stream.stream_type === 'email_metadata' && isGmailUser) || // ENABLED - Email Metadata Collection (Gmail only)
      stream.stream_type === 'spatial' ||
      stream.stream_type === 'location' ||
      stream.stream_type === 'behavioral'
  );
  const activeStreams = visibleStreams.filter(stream => stream.is_enabled);
  const totalEarnings = visibleStreams.reduce((sum, stream) => 
    sum + (stream.data_count || 0) * 1, 0 // 1 point per data collected
  );
  const pendingStreams = visibleStreams.filter(stream => !stream.is_enabled);

  return (
    <StyledView className="flex-1 p-6 bg-gray-100 space-y-6">
      <StyledView className="flex-row items-center justify-between mb-6">
        <StyledView className="flex-1">
          <StyledText className="text-3xl font-bold text-gray-900 mb-2">
            Activity & Data Streams
          </StyledText>
          <StyledText className="text-base text-gray-600">
            Real-time view of your connected data sources and earnings
          </StyledText>
        </StyledView>
        <Button 
          variant="outline" 
          onClick={refreshData}
          disabled={refreshing}
          className="ml-4"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          <StyledText className="text-gray-700 font-medium">Refresh</StyledText>
        </Button>
      </StyledView>


      {/* Stats Overview */}
      <StyledView className="flex-row flex-wrap gap-4">
        <Card className="flex-1 min-w-[280px] bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <StyledView className="flex-row items-center gap-4">
            <StyledView className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <ActivityIcon className="w-6 h-6 text-white" />
            </StyledView>
            <StyledView className="flex-1">
              <StyledText className="text-3xl font-bold text-blue-600">{activeStreams.length}</StyledText>
              <StyledText className="text-sm text-gray-600 font-medium">Active Streams</StyledText>
            </StyledView>
          </StyledView>
        </Card>

        <Card className="flex-1 min-w-[280px] bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <StyledView className="flex-row items-center gap-4">
            <StyledView className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
              <Heart className="w-6 h-6 text-white" />
            </StyledView>
            <StyledView className="flex-1">
              <StyledText className="text-3xl font-bold text-green-600">{totalEarnings.toFixed(0)} pts</StyledText>
              <StyledText className="text-sm text-gray-600 font-medium">Potential Points</StyledText>
            </StyledView>
          </StyledView>
        </Card>

        <Card className="flex-1 min-w-[280px] bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <StyledView className="flex-row items-center gap-4">
            <StyledView className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
              <Settings className="w-6 h-6 text-white" />
            </StyledView>
            <StyledView className="flex-1">
              <StyledText className="text-3xl font-bold text-orange-600">{pendingStreams.length}</StyledText>
              <StyledText className="text-sm text-gray-600 font-medium">Pending Setup</StyledText>
            </StyledView>
          </StyledView>
        </Card>
      </StyledView>

      {/* Email Metadata Collection Section - Only for Gmail Users */}
      {isGmailUser && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <CardHeader className="pb-4">
            <StyledView className="flex-row items-center gap-4">
              <StyledView className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </StyledView>
              <StyledView className="flex-1">
                <CardTitle className="text-xl font-bold text-blue-900">Email Metadata Collection</CardTitle>
                <StyledText className="text-sm text-blue-700 mt-1">
                  Collect email headers (from, to, subject) without body content or attachments
                </StyledText>
              </StyledView>
            </StyledView>
          </CardHeader>
          <CardContent className="space-y-4">
            <StyledView className="grid grid-cols-2 gap-4">
              <StyledView className="bg-white p-4 rounded-lg border border-blue-100">
                <StyledText className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Emails</StyledText>
                <StyledText className="text-2xl font-bold text-blue-600 mt-1">{emailStats.totalEmails}</StyledText>
              </StyledView>
              <StyledView className="bg-white p-4 rounded-lg border border-blue-100">
                <StyledText className="text-xs font-medium text-gray-500 uppercase tracking-wide">Points Earned</StyledText>
                <StyledText className="text-2xl font-bold text-green-600 mt-1">{emailStats.pointsEarned}</StyledText>
              </StyledView>
            </StyledView>
            
            {!gmailSignedIn ? (
              <StyledView className="space-y-3">
                <StyledView className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <StyledView className="flex-row items-center gap-3">
                    <StyledView className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <StyledText className="text-yellow-800 font-bold text-sm">!</StyledText>
                    </StyledView>
                    <StyledView className="flex-1">
                      <StyledText className="text-sm font-medium text-yellow-800">
                        Gmail Authentication Required
                      </StyledText>
                      <StyledText className="text-xs text-yellow-700 mt-1">
                        Sign in to Gmail to collect email metadata
                      </StyledText>
                    </StyledView>
                  </StyledView>
                </StyledView>
                
                <Button 
                  onClick={async () => {
                    try {
                      console.log('Starting Gmail sign-in from Activity screen...');
                      const result = await gmailSignIn();
                      if (result.success) {
                        console.log('Gmail sign-in successful, refreshing email stats...');
                        await fetchEmailStats();
                      }
                    } catch (error) {
                      console.error('Gmail sign-in error:', error);
                      Alert.alert(
                        'Sign-in Error', 
                        `Failed to sign in with Gmail: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or check your Google account settings.`
                      );
                    }
                  }}
                  disabled={gmailSigningIn}
                  className="w-full"
                >
                  {gmailSigningIn ? (
                    <>
                      <ActivityIndicator size="small" color="white" />
                      <StyledText className="text-white font-medium ml-2">Signing In...</StyledText>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      <StyledText className="text-white font-medium">Sign in to Gmail</StyledText>
                    </>
                  )}
                </Button>
              </StyledView>
            ) : (
              <StyledView className="space-y-3">
                <StyledView className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <StyledView className="flex-row items-center gap-3">
                    <StyledView className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                      <StyledText className="text-green-800 font-bold text-sm">✓</StyledText>
                    </StyledView>
                    <StyledView className="flex-1">
                      <StyledText className="text-sm font-medium text-green-800">
                        Signed in as {gmailUser?.email}
                      </StyledText>
                      <StyledText className="text-xs text-green-700 mt-1">
                        Gmail access granted
                      </StyledText>
                    </StyledView>
                    <Button 
                      variant="outline"
                      onClick={gmailSignOut}
                      className="px-3 py-1"
                    >
                      <StyledText className="text-green-700 text-xs">Sign Out</StyledText>
                    </Button>
                  </StyledView>
                </StyledView>
                
                {/* Auto-Collection Status */}
                {autoCollectionStatus.isRunning ? (
                  <StyledView className="bg-green-50 p-4 rounded-lg border border-green-200 mb-3">
                    <StyledView className="flex-row items-center gap-3">
                      <StyledView className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                        <StyledText className="text-green-800 font-bold text-sm">✓</StyledText>
                      </StyledView>
                      <StyledView className="flex-1">
                        <StyledText className="text-sm font-medium text-green-800">
                          Auto-Collection Active
                        </StyledText>
                        <StyledText className="text-xs text-green-700 mt-1">
                          Collecting every {autoCollectionStatus.config.intervalMinutes} minutes
                        </StyledText>
                      </StyledView>
                      <Button 
                        variant="outline"
                        onClick={stopAutoCollection}
                        className="px-3 py-1"
                      >
                        <StyledText className="text-green-700 text-xs">Stop</StyledText>
                      </Button>
                    </StyledView>
                  </StyledView>
                ) : (
                  <StyledView className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-3">
                    <StyledView className="flex-row items-center gap-3">
                      <StyledView className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                        <StyledText className="text-yellow-800 font-bold text-sm">!</StyledText>
                      </StyledView>
                      <StyledView className="flex-1">
                        <StyledText className="text-sm font-medium text-yellow-800">
                          Auto-Collection Disabled
                        </StyledText>
                        <StyledText className="text-xs text-yellow-700 mt-1">
                          Enable to automatically collect emails
                        </StyledText>
                      </StyledView>
                      <Button 
                        onClick={startAutoCollection}
                        className="px-3 py-1"
                      >
                        <StyledText className="text-white text-xs">Enable</StyledText>
                      </Button>
                    </StyledView>
                  </StyledView>
                )}

                {/* Re-authentication prompt */}
                {autoCollectionStatus.needsReauth && (
                  <StyledView className="bg-red-50 p-4 rounded-lg border border-red-200 mb-3">
                    <StyledView className="flex-row items-center gap-3">
                      <StyledView className="w-8 h-8 bg-red-400 rounded-full flex items-center justify-center">
                        <StyledText className="text-red-800 font-bold text-sm">!</StyledText>
                      </StyledView>
                      <StyledView className="flex-1">
                        <StyledText className="text-sm font-medium text-red-800">
                          Session Expired
                        </StyledText>
                        <StyledText className="text-xs text-red-700 mt-1">
                          Please re-authenticate to continue auto-collection
                        </StyledText>
                      </StyledView>
                      <Button 
                        onClick={handleReauth}
                        className="px-3 py-1"
                      >
                        <StyledText className="text-white text-xs">Re-auth</StyledText>
                      </Button>
                    </StyledView>
                  </StyledView>
                )}

                <StyledView className="flex-row gap-3">
                  <Button 
                    onClick={collectEmailMetadata}
                    disabled={emailCollecting}
                    className="flex-1"
                  >
                    {emailCollecting ? (
                      <>
                        <ActivityIndicator size="small" color="white" />
                        <StyledText className="text-white font-medium ml-2">Collecting...</StyledText>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        <StyledText className="text-white font-medium">Collect Now</StyledText>
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={forceCollection}
                    className="px-4"
                  >
                    <StyledText className="text-gray-700 text-xs">Force</StyledText>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={fetchEmailStats}
                    className="px-6"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </StyledView>
              </StyledView>
            )}
            
            {emailStats.lastCollectionDate && (
              <StyledView className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <StyledText className="text-xs font-medium text-blue-700">Last Collection</StyledText>
                <StyledText className="text-sm text-blue-600 mt-1">
                  {new Date(emailStats.lastCollectionDate).toLocaleString()}
                </StyledText>
              </StyledView>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Streams */}
      <StyledView className="space-y-6">
        <StyledView className="flex-row items-center justify-between">
          <StyledText className="text-2xl font-bold text-gray-900">Data Streams</StyledText>
          <StyledText className="text-sm text-gray-500">{visibleStreams.length} streams available</StyledText>
        </StyledView>
        <StyledView className="space-y-4">
          {visibleStreams.map((stream) => {
            const IconComponent = streamIcons[stream.stream_type as keyof typeof streamIcons] || ActivityIcon;
            const streamName = streamNames[stream.stream_type as keyof typeof streamNames] || stream.stream_type;
            const potentialEarnings = (stream.data_count || 0) * 1; // 1 point per data collected
            
            return (
              <Card key={stream.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <CardHeader className="pb-4 border-b border-gray-100">
                  <StyledView className="flex-row items-center justify-between">
                    <StyledView className="flex-row items-center gap-4">
                      <StyledView className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        stream.is_enabled ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <IconComponent className={`w-5 h-5 ${
                          stream.is_enabled ? 'text-green-600' : 'text-gray-500'
                        }`} />
                      </StyledView>
                      <StyledView>
                        <CardTitle className="text-lg font-semibold text-gray-900">{streamName}</CardTitle>
                        <StyledText className="text-sm text-gray-500">
                          {stream.is_enabled ? 'Active and collecting data' : 'Not currently active'}
                        </StyledText>
                      </StyledView>
                    </StyledView>
                    <Badge 
                      variant={stream.is_enabled ? "default" : "secondary"}
                      className={stream.is_enabled ? "bg-green-500" : "bg-gray-200"}
                    >
                      {stream.is_enabled ? "Active" : "Disabled"}
                    </Badge>
                  </StyledView>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <StyledView className="grid grid-cols-2 gap-4">
                    <StyledView className="bg-gray-50 p-4 rounded-lg">
                      <StyledText className="text-xs font-medium text-gray-500 uppercase tracking-wide">Earnings Rate</StyledText>
                      <StyledText className="text-lg font-bold text-green-600 mt-1">1 pt/data</StyledText>
                    </StyledView>
                    <StyledView className="bg-gray-50 p-4 rounded-lg">
                      <StyledText className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data Points</StyledText>
                      <StyledText className="text-lg font-bold text-gray-900 mt-1">{stream.data_count || 0} collected</StyledText>
                    </StyledView>
                  </StyledView>
                  
                  <StyledView className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <StyledView className="flex-row justify-between items-center">
                      <StyledText className="text-sm font-medium text-blue-700">Potential Earnings</StyledText>
                      <StyledText className="text-lg font-bold text-blue-600">{potentialEarnings} pts</StyledText>
                    </StyledView>
                  </StyledView>
                  
                  <StyledView className="flex-row justify-between items-center pt-2 border-t border-gray-100">
                    <StyledView>
                      <StyledText className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Sync</StyledText>
                      <StyledText className="text-sm text-gray-900 mt-1">
                        {stream.last_sync_at 
                          ? new Date(stream.last_sync_at).toLocaleDateString()
                          : 'Never'
                        }
                      </StyledText>
                    </StyledView>
                    {!stream.is_enabled && (
                      <StyledView className="bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
                        <StyledText className="text-xs text-yellow-700 font-medium">
                          Enable in Settings to start earning
                        </StyledText>
                      </StyledView>
                    )}
                  </StyledView>
                </CardContent>
              </Card>
            );
          })}
        </StyledView>
      </StyledView>
    </StyledView>
  );
}
