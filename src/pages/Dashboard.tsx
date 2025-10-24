import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'; // Import core React Native components
import { User, Star, Target, Trophy } from "lucide-react-native"; // Assuming lucide-react-native is installed
import { styled } from 'nativewind'; // For applying Tailwind classes
import { useEffect } from 'react';

// Assuming useProfile, useDataStreams, useEarnings, and useAuth are already
// adapted for React Native (their underlying logic with Supabase is usually compatible).
import { useProfile } from '../hooks/useProfile';
// import { useDataStreams } from '../hooks/useDataStreams';
// import { useEarnings } from '../hooks/useEarnings';
import { useAuth } from '../contexts/AuthContext';
import { useDeviceFingerprinting } from '../contexts/DeviceFingerprintingContext';

// Styled components using Nativewind for reusability
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

// Replicating simplified Card components for React Native (from previous conversions)
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = styled(({ children, className }: CardProps) => (
  <StyledView className={`rounded-lg bg-white shadow-md ${className}`}>
    {children}
  </StyledView>
));

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}
const CardHeader = styled(({ children, className }: CardHeaderProps) => (
  <StyledView className={`p-4 pb-0 ${className}`}>
    {children}
  </StyledView>
));

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}
const CardTitle = styled(({ children, className }: CardTitleProps) => (
  <StyledText className={`text-lg font-semibold ${className}`}>
    {children}
  </StyledText>
));

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}
const CardContent = styled(({ children, className }: CardContentProps) => (
  <StyledView className={`p-4 pt-3 ${className}`}>
    {children}
  </StyledView>
));

// Replicating simplified Button component (from previous conversions)
interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void; // Changed onClick to onPress for React Native
  disabled?: boolean;
  variant?: 'outline' | 'default';
  className?: string;
}
const Button = styled(({ children, onPress, disabled, variant = 'default', className }: ButtonProps) => (
  <StyledTouchableOpacity
    onPress={onPress}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg flex-row items-center justify-center 
      ${variant === 'outline' ? 'border border-gray-300 bg-white' : 'bg-blue-500'}
      ${disabled ? 'opacity-50' : ''}
      ${className}
    `}
  >
    {typeof children === 'string' ? (
      <StyledText className={`${variant === 'outline' ? 'text-gray-700' : 'text-white'}`}>
        {children}
      </StyledText>
    ) : (
      children
    )}
  </StyledTouchableOpacity>
));

// Replicating KPICard component
interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>; // For Lucide icons
  className?: string;
}

const KPICard = ({ title, value, icon: Icon, className }: KPICardProps) => (
  <Card className={`flex-1 ${className}`}> {/* flex-1 for equal width */}
    <CardContent className="p-6 flex-row items-center justify-between">
      <StyledView>
        <StyledText className="text-sm font-medium text-gray-500">{title}</StyledText>
        <StyledText className="text-3xl font-bold text-gray-900 mt-1">{value}</StyledText>
      </StyledView>
      <Icon className="w-8 h-8 text-blue-500" /> {/* Example color */}
    </CardContent>
  </Card>
);


export default function Dashboard({ navigation }: any) {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  
  // Safely use device fingerprinting with error handling
  let trackEvent: ((eventType: string, eventData?: Record<string, any>) => Promise<void>) | null = null;
  
  try {
    const deviceFingerprinting = useDeviceFingerprinting();
    trackEvent = deviceFingerprinting.trackEvent;
  } catch (error) {
    console.warn('Device fingerprinting not available in Dashboard:', error);
    // Provide a fallback function
    trackEvent = async () => {
      console.log('Device fingerprinting not available, event not tracked');
    };
  }
  
  // const { dataStreams, loading: streamsLoading } = useDataStreams();
  // const { transactions, loading: earningsLoading } = useEarnings();

  // Track dashboard view event
  useEffect(() => {
    if (trackEvent) {
      trackEvent('dashboard_viewed', {
        user_id: user?.id,
        profile_completion: profile?.profile_completion_percentage || 0,
        total_earnings: profile?.total_earnings || 0,
      }).catch(error => {
        console.warn('Failed to track dashboard view event:', error);
      });
    }
  }, [trackEvent, user, profile]);

  if (profileLoading) {
    return (
      <StyledView className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#0000ff" />
        <StyledText className="text-xl font-bold mt-4">
          Loading Dashboard...
        </StyledText>
      </StyledView>
    );
  }

  // const activeStreams = dataStreams.filter(stream => stream.is_enabled).length;
  const totalEarnings = profile?.total_earnings || 0;
  // const completedSurveys = transactions.filter(t => t.transaction_type === 'survey').length;
  const profileCompletion = profile?.profile_completion_percentage || 0;
  const userName = profile?.first_name || user?.email?.split('@')[0] || 'User';

  const handleEditProfile = () => {
    if (trackEvent) {
      trackEvent('edit_profile_clicked', {
        user_id: user?.id,
        profile_completion: profileCompletion,
      }).catch(error => {
        console.warn('Failed to track edit profile event:', error);
      });
    }
    console.log('Edit Profile Pressed');
  };

  const handleQuickAction = (action: string) => {
    if (trackEvent) {
      trackEvent(`${action}_clicked`).catch(error => {
        console.warn(`Failed to track ${action} event:`, error);
      });
    }
    
    // Provide meaningful actions for each quick action button
    switch (action) {
      case 'complete_profile_setup':
        // Navigate to Settings tab for profile completion
        if (navigation) {
          navigation.navigate('Settings', { initialTab: 'profile' });
        }
        break;
      case 'view_available_missions':
        // Navigate to Surveys tab
        if (navigation) {
          navigation.navigate('Surveys');
        }
        break;
      case 'connect_new_data_source':
        // Navigate to Settings tab (data-streams tab is commented out)
        if (navigation) {
          navigation.navigate('Settings');
        }
        break;
      default:
        console.log(`Quick action: ${action}`);
    }
  };

  return (
    <StyledView className="flex-1 p-6 bg-gray-100 space-y-6">
      <StyledView>
        <StyledText className="text-2xl font-bold text-gray-900 mb-2">
          Hello, {userName}!
        </StyledText>
        <StyledText className="text-sm text-gray-500">
          Welcome to your personalized data dashboard.
        </StyledText>
      </StyledView>

      {/* Overview KPIs */}
      <StyledView className="flex-col md:flex-row gap-4"> {/* Use flex-col and responsive classes if needed */}
        <KPICard
          title="Total Points"
          value={`${totalEarnings.toFixed(0)} pts`}
          icon={Star}
          className="bg-white shadow-md"
        />
        <KPICard
          title="Active Streams"
          value={0}
          icon={User}
          className="bg-white shadow-md"
        />
        <KPICard
          title="Surveys Completed"
          value={0}
          icon={Trophy}
          className="bg-white shadow-md"
        />
      </StyledView>

      {/* Main Content Area */}
      <StyledView className="flex-col lg:flex-row gap-6">
        {/* Profile Completion */}
        <Card className="flex-2 bg-white shadow-md"> {/* Replace glass-card conceptually */}
          <CardHeader>
            <CardTitle>Profile Completion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StyledView className="relative w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mx-auto">
              {/* This is a simplified circle for progress. A true circular progress bar
                  would require a library like 'react-native-svg' and custom drawing. */}
              <StyledView
                className="absolute inset-0 rounded-full"
                style={{
                  backgroundColor: '#3b82f6', // Tailwind blue-500
                  transform: [{ rotateZ: `${(profileCompletion / 100) * 360}deg` }],
                }}
              />
              <StyledText className="text-xl font-bold text-blue-600 z-10">{profileCompletion}%</StyledText>
            </StyledView>
            <StyledText className="text-center text-sm text-gray-500">
              Complete your profile to unlock more earning opportunities.
            </StyledText>
            <Button onPress={handleEditProfile} className="w-full">
              <Text className="text-white">Edit Profile</Text>
            </Button>
          </CardContent>
        </Card>

        {/* Earnings Overview */}
        <Card className="flex-3 bg-white shadow-md"> {/* Replace glass-card conceptually */}
          <CardHeader>
            <CardTitle>Earnings Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <StyledView className="h-64 flex items-center justify-center text-gray-500">
              <StyledView className="text-center">
                <StyledView className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Star className="w-8 h-8 text-white" />
                </StyledView>
                <StyledText>Chart visualization coming soon</StyledText>
              </StyledView>
            </StyledView>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="flex-2 bg-white shadow-md"> {/* Replace glass-card conceptually */}
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StyledView className="space-y-3">
              <Button onPress={() => handleQuickAction('complete_profile_setup')} className="w-full justify-start h-12" variant="outline">
                <Target className="w-5 h-5 mr-3" />
                <StyledText className="text-gray-700">Complete Profile Setup</StyledText>
              </Button>
              <Button onPress={() => handleQuickAction('view_available_missions')} className="w-full justify-start h-12" variant="outline">
                <Trophy className="w-5 h-5 mr-3" />
                <StyledText className="text-gray-700">View Available Missions</StyledText>
              </Button>
              <Button onPress={() => handleQuickAction('connect_new_data_source')} className="w-full justify-start h-12" variant="outline">
                <User className="w-5 h-5 mr-3" />
                <StyledText className="text-gray-700">Connect New Data Source</StyledText>
              </Button>
            </StyledView>
          </CardContent>
        </Card>
      </StyledView>
    </StyledView>
  );
}
