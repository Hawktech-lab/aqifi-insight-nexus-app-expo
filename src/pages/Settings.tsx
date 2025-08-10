import { View, Text, TouchableOpacity, Switch, TextInput, ActivityIndicator, Image } from 'react-native';
import { useEffect, useState } from 'react';
import {
  User, Wallet, Shield, Bell, Smartphone, MapPin, Mail, Wifi, Heart, Navigation, Zap, Play, RefreshCw, CheckCircle, AlertCircle, Edit2, LogOut, KeyRound
} from "lucide-react-native"; // Assuming lucide-react-native is installed
import { styled } from 'nativewind';

// Styled components using Nativewind for reusability
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledTextInput = styled(TextInput);
const StyledImage = styled(Image);

// Replicating simplified Card components
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

// Replicating simplified Button component
interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'outline' | 'default' | 'destructive'; // Added 'destructive'
  size?: 'sm' | 'default' | 'lg' | 'icon'; // Added 'icon'
  className?: string;
}
const Button = styled(({ children, onPress, disabled, variant = 'default', size = 'default', className }: ButtonProps) => {
  let buttonClasses = `px-4 py-2 rounded-lg flex-row items-center justify-center `;
  let textClasses = `text-white`;

  if (variant === 'outline') {
    buttonClasses += `border border-gray-300 bg-white`;
    textClasses = `text-gray-700`;
  } else if (variant === 'destructive') {
    buttonClasses += `bg-red-500`;
    textClasses = `text-white`;
  } else { // default
    buttonClasses += `bg-blue-500`;
    textClasses = `text-white`;
  }

  if (size === 'sm') {
    buttonClasses += ` h-8 px-3 text-sm`;
  } else if (size === 'lg') {
    buttonClasses += ` h-12 px-8 text-lg`;
  } else if (size === 'icon') {
    buttonClasses += ` h-10 w-10`; // Fixed width/height for icon
  } else { // default
    buttonClasses += ` h-10 px-4`;
  }

  if (disabled) {
    buttonClasses += ` opacity-50`;
  }

  return (
    <StyledTouchableOpacity
      onPress={onPress}
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
});

// Replicating simplified Input component
interface InputProps {
  id?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: TextInput['props']['keyboardType'];
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  className?: string;
}
const Input = styled(({ className, ...props }: InputProps) => (
  <StyledTextInput
    className={`border border-gray-300 rounded-md p-2 text-base ${className}`}
    {...props}
  />
));

// Replicating simplified Label component
interface LabelProps {
  children: React.ReactNode;
  className?: string;
}
const Label = styled(({ children, className }: LabelProps) => (
  <StyledText className={`text-sm font-medium text-gray-700 mb-1 ${className}`}>
    {children}
  </StyledText>
));

// Replicating simplified Badge component
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  className?: string;
}
const Badge = styled(({ children, variant = 'default', className }: BadgeProps) => {
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
    badgeClasses += `bg-gray-800`;
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
});


// Replicating simplified Avatar component
interface AvatarProps {
  src?: string;
  alt?: string;
  fallback: string;
  className?: string;
}
const Avatar = styled(({ src, alt, fallback, className }: AvatarProps) => (
  <StyledView className={`w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center ${className}`}>
    {src ? (
      <StyledImage source={{ uri: src }} className="w-full h-full" alt={alt || 'avatar'} />
    ) : (
      <StyledText className="text-xl font-medium text-gray-600">{fallback}</StyledText>
    )}
  </StyledView>
));

interface AvatarFallbackProps {
  children: React.ReactNode;
  className?: string;
}
const AvatarFallback = styled(({ children, className }: AvatarFallbackProps) => (
  <StyledView className={`w-full h-full flex items-center justify-center bg-gray-300 ${className}`}>
    <StyledText className="text-lg text-gray-600">{children}</StyledText>
  </StyledView>
));

interface AvatarImageProps {
  src?: string;
  alt?: string;
  className?: string;
}
const AvatarImage = styled(({ src, alt, className }: AvatarImageProps) => (
  <StyledImage source={{ uri: src }} className={`w-full h-full ${className}`} alt={alt || 'avatar'} />
));


// Simplified Tabs implementation for React Native
interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
}
const Tabs = styled(({ defaultValue, children }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  // Filter children to get TabsList and TabsContent
  const tabsList = (Array.isArray(children) ? children : [children]).find(
    (child: any) => child && child.props && child.props.isTabsList
  );
  const tabsContent = (Array.isArray(children) ? children : [children]).filter(
    (child: any) => child && child.props && child.props.isTabsContent
  );

  return (
    <StyledView>
      {tabsList && React.cloneElement(tabsList, { activeTab, setActiveTab })}
      {tabsContent.map((child: any) =>
        React.cloneElement(child, { key: child.props.value, activeTab })
      )}
    </StyledView>
  );
});

interface TabsListProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (value: string) => void;
  className?: string;
  isTabsList?: boolean; // Marker for Tabs component
}
const TabsList = styled(({ children, activeTab, setActiveTab, className, isTabsList }: TabsListProps) => (
  <StyledView className={`flex-row rounded-lg p-1 bg-gray-200 mb-6 ${className}`}>
    {(Array.isArray(children) ? children : [children]).map((child: any) =>
      React.cloneElement(child, {
        key: child.props.value,
        activeTab,
        onPress: () => setActiveTab(child.props.value),
      })
    )}
  </StyledView>
), { isTabsList: true }); // Mark as TabsList

interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  activeTab?: string; // Passed from TabsList
  onPress?: () => void; // Passed from TabsList
  className?: string;
}
const TabsTrigger = styled(({ children, value, activeTab, onPress, className }: TabsTriggerProps) => (
  <StyledTouchableOpacity
    className={`flex-1 items-center py-2 rounded-md ${activeTab === value ? 'bg-white shadow' : ''} ${className}`}
    onPress={onPress}
  >
    {typeof children === 'string' ? (
      <StyledText className={`${activeTab === value ? 'text-black font-semibold' : 'text-gray-600'}`}>
        {children}
      </StyledText>
    ) : (
      children
    )}
  </StyledTouchableOpacity>
));

interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  activeTab?: string; // Passed from Tabs
  className?: string;
  isTabsContent?: boolean; // Marker for Tabs component
}
const TabsContent = styled(({ children, value, activeTab, className, isTabsContent }: TabsContentProps) => (
  activeTab === value ? <StyledView className={`${className}`}>{children}</StyledView> : null
), { isTabsContent: true }); // Mark as TabsContent


// Placeholder for KYCStatus and KYCAdminPanel components if they are not provided
const KYCStatus = () => (
  <Card className="glass-card mb-4">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Shield className="w-5 h-5" />
        KYC Status
      </CardTitle>
    </CardHeader>
    <CardContent className="flex-row items-center justify-between">
      <StyledView className="flex-row items-center gap-2">
        <AlertCircle className="w-5 h-5 text-yellow-500" />
        <StyledText className="text-sm font-medium text-yellow-500">
          Verification Pending
        </StyledText>
      </StyledView>
      <Button size="sm" onPress={() => console.log('Start KYC Process')}>
        Start Verification
      </Button>
    </CardContent>
  </Card>
);

const KYCAdminPanel = () => (
  <Card className="glass-card">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Shield className="w-5 h-5" />
        KYC Admin Panel (Placeholder)
      </CardTitle>
    </CardHeader>
    <CardContent>
      <StyledText className="text-muted-foreground text-sm">
        This is a placeholder for the KYC Admin Panel functionality.
      </StyledText>
    </CardContent>
  </Card>
);


const streamIcons = {
  steps: Heart,
  device_metadata: Smartphone,
  email_metadata: Mail,
  wifi: Wifi,
  spatial: Navigation,
  location: MapPin,
  behavioral: Zap,
};

const streamNames = {
  steps: "Steps & Activity Tracking",
  device_metadata: "Device Information",
  email_metadata: "Gmail Data Access",
  wifi: "WiFi Network Sharing",
  spatial: "Spatial Movement Data",
  location: "Location Data",
  behavioral: "Behavioral Data",
};

export default function Settings() {
  const { user, signOut } = useAuth(); // Assuming useAuth is adapted for RN
  const { profile, loading: profileLoading, updateProfile } = useProfile(); // Assuming useProfile is adapted for RN
  const { dataStreams, loading: streamsLoading, updateStreamStatus, refreshStreams } = useDataStreams(); // Assuming useDataStreams is adapted for RN

  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [isRefreshingStreams, setIsRefreshingStreams] = useState(false);
  const [currentTab, setCurrentTab] = useState('profile'); // State for managing tabs

  // State for profile form fields
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
    }
  }, [profile]);

  const handleProfileUpdate = async () => {
    setIsSubmittingProfile(true);
    await updateProfile({ first_name: firstName, last_name: lastName });
    // In a real app, you might show a success message via a toast or alert
    console.log('Profile updated successfully!');
    setIsSubmittingProfile(false);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }
    setIsSubmittingPassword(true);
    // This assumes a supabase.auth.updateUser method exists, if not,
    // you'd need to implement password change logic in useAuth or similar.
    // For now, it's a placeholder.
    console.log('Attempting to change password...');
    // await supabase.auth.updateUser({ password: newPassword });
    console.log('Password change initiated (check Supabase for actual implementation).');
    setNewPassword('');
    setConfirmPassword('');
    setIsSubmittingPassword(false);
  };

  const handleStreamToggle = async (streamType: string, isEnabled: boolean) => {
    await updateStreamStatus(streamType, isEnabled);
    console.log(`Stream ${streamType} toggled to ${isEnabled}`);
  };

  const handleRefreshStreams = async () => {
    setIsRefreshingStreams(true);
    // In React Native, window.location.reload() is not available.
    // Instead, you re-fetch data using the hook's refresh function.
    await refreshStreams();
    setIsRefreshingStreams(false);
    console.log('Data streams refreshed.');
  };

  const handleSignOut = async () => {
    await signOut();
    // In a real React Native app, you would navigate to the Auth screen
    console.log('User signed out.');
  };

  if (profileLoading || streamsLoading) {
    return (
      <StyledView className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#0000ff" />
        <StyledText className="text-xl font-bold mt-4">Loading settings...</StyledText>
      </StyledView>
    );
  }

  const getInitials = (firstName: string | null | undefined, lastName: string | null | undefined) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <StyledView className="flex-1 p-6 bg-gray-100 space-y-6">
      <StyledView>
        <StyledText className="text-2xl font-bold text-gray-900 mb-2">Settings</StyledText>
        <StyledText className="text-sm text-gray-500">
          Manage your account and preferences.
        </StyledText>
      </StyledView>

      <Tabs defaultValue="profile" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList>
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="data-streams">
            <Wallet className="w-4 h-4 mr-2" />
            Data Streams
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Security & Privacy
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="glass-card mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StyledView className="flex-row items-center space-x-4">
                <Avatar fallback={getInitials(profile?.first_name, profile?.last_name)}>
                  {/* AvatarImage should be passed as a prop if needed */}
                </Avatar>
                <StyledView className="flex-1">
                  <StyledText className="text-lg font-semibold">{profile?.first_name} {profile?.last_name}</StyledText>
                  <StyledText className="text-sm text-muted-foreground">{user?.email}</StyledText>
                </StyledView>
                <Button size="sm" onPress={() => console.log('Upload avatar - not implemented')}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              </StyledView>

              <StyledView className="space-y-4">
                <StyledView className="flex-row gap-4">
                  <StyledView className="flex-1 space-y-2">
                    <Label>First Name</Label>
                    <Input
                      placeholder="John"
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                  </StyledView>
                  <StyledView className="flex-1 space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      placeholder="Doe"
                      value={lastName}
                      onChangeText={setLastName}
                    />
                  </StyledView>
                </StyledView>
                <Button onPress={handleProfileUpdate} disabled={isSubmittingProfile}>
                  {isSubmittingProfile ? <ActivityIndicator color="#fff" /> : 'Save Changes'}
                </Button>
              </StyledView>
            </CardContent>
          </Card>

          <KYCStatus />
        </TabsContent>

        <TabsContent value="data-streams">
          <StyledView className="flex-row items-center justify-between mb-4">
            <StyledText className="text-lg font-semibold">
              Manage Data Streams
            </StyledText>
            <Button size="sm" variant="outline" onPress={handleRefreshStreams} disabled={isRefreshingStreams}>
              {isRefreshingStreams ? <ActivityIndicator size="small" color="#000" /> : <RefreshCw className="w-4 h-4 mr-1" />}
              Refresh
            </Button>
          </StyledView>

          <StyledView className="space-y-4">
            {dataStreams.map((stream) => {
              const Icon = streamIcons[stream.stream_type as keyof typeof streamIcons] || Play;
              const streamName = streamNames[stream.stream_type as keyof typeof streamNames] || 'Unknown Stream';
              return (
                <Card key={stream.id} className="glass-card">
                  <CardContent className="flex-row items-center justify-between">
                    <StyledView className="flex-row items-center space-x-3">
                      <Icon className="w-6 h-6 text-gray-700" />
                      <StyledView>
                        <StyledText className="font-medium">{streamName}</StyledText>
                        <Badge variant={stream.is_enabled ? 'default' : 'secondary'} className="mt-1">
                          {stream.is_enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </StyledView>
                    </StyledView>
                    <Switch
                      value={stream.is_enabled}
                      onValueChange={(newValue) => handleStreamToggle(stream.stream_type, newValue)}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </StyledView>
        </TabsContent>

        <TabsContent value="security">
          <Card className="glass-card mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StyledView className="space-y-2">
                <Label>New Password</Label>
                <Input
                  placeholder="Enter new password"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </StyledView>
              <StyledView className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  placeholder="Confirm new password"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </StyledView>
              {passwordError && (
                <StyledText className="text-red-500 text-sm">{passwordError}</StyledText>
              )}
              <Button onPress={handleChangePassword} disabled={isSubmittingPassword}>
                {isSubmittingPassword ? <ActivityIndicator color="#fff" /> : 'Update Password'}
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="w-5 h-5" />
                Account Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StyledView className="flex-row items-center justify-between">
                <StyledView>
                  <StyledText className="font-medium">Sign Out</StyledText>
                  <StyledText className="text-sm text-muted-foreground">End your session</StyledText>
                </StyledView>
                <Button variant="outline" onPress={handleSignOut}>
                  Sign Out
                </Button>
              </StyledView>
              {/* For Delete Account, would need a confirmation dialog and backend logic */}
              <StyledView className="flex-row items-center justify-between">
                <StyledView>
                  <StyledText className="font-medium">Delete Account</StyledText>
                  <StyledText className="text-sm text-muted-foreground">Permanently delete your account and data</StyledText>
                </StyledView>
                <Button variant="destructive" onPress={() => console.log('Delete account - confirmation needed')}>
                  Delete
                </Button>
              </StyledView>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StyledView className="space-y-3">
                <StyledView className="flex-row items-center justify-between">
                  <StyledView>
                    <StyledText className="font-medium">New Survey Alerts</StyledText>
                    <StyledText className="text-sm text-muted-foreground">Get notified about new earning opportunities</StyledText>
                  </StyledView>
                  {/* This would be a Switch in RN */}
                  <Switch value={true} onValueChange={(value) => console.log('Toggle New Survey Alerts', value)} />
                </StyledView>

                <StyledView className="flex-row items-center justify-between">
                  <StyledView>
                    <StyledText className="font-medium">Earnings Updates</StyledText>
                    <StyledText className="text-sm text-muted-foreground">Weekly summary of your earnings</StyledText>
                  </StyledView>
                  {/* This would be a Switch in RN */}
                  <Switch value={true} onValueChange={(value) => console.log('Toggle Earnings Updates', value)} />
                </StyledView>
              </StyledView>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </StyledView>
  );
}
