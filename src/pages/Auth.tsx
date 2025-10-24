import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'; // Import React Native components
import { useAuth } from '../contexts/AuthContext'; // Assuming AuthContext is correctly set up for RN

// Replicating simplified Card components for React Native
const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <View className={`w-full max-w-md bg-white/10 rounded-lg p-6 shadow-lg ${className}`}>
    {children}
  </View>
);

const CardHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <View className={`text-center mb-4 ${className}`}>
    {children}
  </View>
);

const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <Text className={`text-3xl font-bold text-foreground ${className}`}>
    {children}
  </Text>
);

const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <View className={`space-y-4 ${className}`}>
    {children}
  </View>
);

// Replicating simplified Alert components for React Native
const Alert = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <View className={`mt-4 p-3 rounded-md border ${className}`}>
    {children}
  </View>
);

const AlertDescription = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <Text className={`${className}`}>
    {children}
  </Text>
);

export default function Auth() {
  const { user, signIn, signUp, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'signin' | 'signup'>('signin'); // State to manage tabs

  // Redirect if already authenticated
  if (user && !loading) {
    // In a real React Native app, you would typically use navigation
    // from a library like @react-navigation/native, e.g.,
    // const navigation = useNavigation();
    // navigation.replace('HomeScreen');
    return null; // Or a loading indicator while navigation occurs
  }

  const handleSignIn = async (email: string, password: string) => {
    setIsSubmitting(true);
    setError(null);

    const { error: authError } = await signIn(email, password);
    
    if (authError) {
      setError(authError.message);
    }
    
    setIsSubmitting(false);
  };

  const handleSignUp = async (email: string, password: string, firstName: string, lastName: string) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const { error: authError } = await signUp(email, password, firstName, lastName);
    
    if (authError) {
      setError(authError.message);
    } else {
      setSuccess('Check your email for the confirmation link!');
    }
    
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-2 text-lg">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-gray-100 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Aqifi</CardTitle>
          <Text className="text-base text-muted-foreground mt-2">
            Start earning rewards from your data
          </Text>
        </CardHeader>
        <CardContent>
          <View className="flex-row rounded-lg p-1 bg-gray-200 justify-around mb-4">
            <TouchableOpacity
              className={`flex-1 items-center py-2 rounded-md ${currentTab === 'signin' ? 'bg-white shadow' : ''}`}
              onPress={() => setCurrentTab('signin')}
            >
              <Text className={`${currentTab === 'signin' ? 'text-black font-semibold' : 'text-gray-600'}`}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 items-center py-2 rounded-md ${currentTab === 'signup' ? 'bg-white shadow' : ''}`}
              onPress={() => setCurrentTab('signup')}
            >
              <Text className={`${currentTab === 'signup' ? 'text-black font-semibold' : 'text-gray-600'}`}>Sign Up</Text>
            </TouchableOpacity>
          </View>
          
          {currentTab === 'signin' ? (
            <View className="space-y-4">
              <View className="space-y-2">
                <Text className="text-sm font-medium text-gray-700">Email</Text>
                <TextInput
                  className="border border-gray-300 rounded-md p-2 text-base"
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={(text) => handleSignIn(text, password)} // Simplified for example, normally controlled inputs
                />
              </View>
              <View className="space-y-2">
                <Text className="text-sm font-medium text-gray-700">Password</Text>
                <TextInput
                  className="border border-gray-300 rounded-md p-2 text-base"
                  placeholder="Enter your password"
                  secureTextEntry
                  onChangeText={(text) => handleSignIn(email, text)} // Simplified for example
                />
              </View>
              <TouchableOpacity
                className="bg-blue-500 rounded-md p-3 items-center justify-center"
                onPress={() => {
                  // This is a placeholder. In a real app, you would get values from controlled inputs.
                  handleSignIn('test@example.com', 'password'); 
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-semibold text-lg">Sign In</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View className="space-y-4">
              <View className="flex-row gap-4">
                <View className="flex-1 space-y-2">
                  <Text className="text-sm font-medium text-gray-700">First Name</Text>
                  <TextInput
                    className="border border-gray-300 rounded-md p-2 text-base"
                    placeholder="John"
                  />
                </View>
                <View className="flex-1 space-y-2">
                  <Text className="text-sm font-medium text-gray-700">Last Name</Text>
                  <TextInput
                    className="border border-gray-300 rounded-md p-2 text-base"
                    placeholder="Doe"
                  />
                </View>
              </View>
              <View className="space-y-2">
                <Text className="text-sm font-medium text-gray-700">Email</Text>
                <TextInput
                  className="border border-gray-300 rounded-md p-2 text-base"
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View className="space-y-2">
                <Text className="text-sm font-medium text-gray-700">Password</Text>
                <TextInput
                  className="border border-gray-300 rounded-md p-2 text-base"
                  placeholder="Create a password"
                  secureTextEntry
                  minLength={6}
                />
              </View>
              <TouchableOpacity
                className="bg-blue-500 rounded-md p-3 items-center justify-center"
                onPress={() => {
                  // Placeholder for sign up. In a real app, you would get values from controlled inputs.
                  handleSignUp('newuser@example.com', 'newpassword', 'Jane', 'Doe');
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-semibold text-lg">Create Account</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {error && (
            <Alert className="border-red-500">
              <AlertDescription className="text-red-500">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-500">
              <AlertDescription className="text-green-500">
                {success}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </View>
  );
}
