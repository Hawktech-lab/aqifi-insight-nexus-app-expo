import { View, Text, TouchableOpacity } from 'react-native'; // Import core React Native components
import { useEffect } from 'react';
import { Home, AlertCircle } from "lucide-react-native"; // Assuming lucide-react-native is installed
import { styled } from 'nativewind'; // For applying Tailwind classes

// Styled components using Nativewind for reusability
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

// Replicating simplified Card components for React Native
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = styled(({ children, className }: CardProps) => (
  <StyledView className={`rounded-lg bg-white shadow-md ${className}`}>
    {children}
  </StyledView>
));

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}
const CardContent = styled(({ children, className }: CardContentProps) => (
  <StyledView className={`p-4 ${className}`}>
    {children}
  </StyledView>
));

// Replicating simplified Button component
interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void; // Changed onClick to onPress for React Native
  className?: string;
}
const Button = styled(({ children, onPress, className }: ButtonProps) => (
  <StyledTouchableOpacity
    onPress={onPress}
    className={`px-4 py-2 rounded-lg flex-row items-center justify-center bg-blue-500 ${className}`}
  >
    {typeof children === 'string' ? (
      <StyledText className="text-white">
        {children}
      </StyledText>
    ) : (
      children
    )}
  </StyledTouchableOpacity>
));


const NotFound = () => {
  // In React Native, useLocation is part of navigation libraries like @react-navigation/native.
  // For this standalone file conversion, we'll remove the path logging.
  // useEffect(() => {
  //   console.error(
  //     "404 Error: User attempted to access non-existent route:",
  //     location.pathname
  //   );
  // }, [location.pathname]);

  const handleGoHome = () => {
    // In a real React Native app, you would use navigation here, e.g.:
    // const navigation = useNavigation();
    // navigation.replace('Home');
    console.log('Navigating to Home...');
  };

  return (
    <StyledView className="flex-1 items-center justify-center p-4 bg-gray-100">
      <Card className="max-w-md w-full bg-white/10 rounded-lg p-6 shadow-lg"> {/* approximated glass-card */}
        <CardContent className="p-8 text-center space-y-6">
          <StyledView className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center"> {/* approximated gradient-to-br */}
            <AlertCircle className="w-8 h-8 text-red-500" />
          </StyledView>
          
          <StyledView className="space-y-2">
            {/* gradient-text is hard to achieve directly in RN with Nativewind. Using solid color. */}
            <StyledText className="text-4xl font-bold text-red-600">404</StyledText>
            <StyledText className="text-2xl font-semibold text-gray-800">Page Not Found</StyledText>
            <StyledText className="text-base text-gray-500">
              The page you're looking for doesn't exist or has been moved.
            </StyledText>
          </StyledView>

          <Button onPress={handleGoHome} className="w-full">
              <Home className="w-4 h-4 mr-2 text-white" />
              <StyledText className="text-white">Go Back Home</StyledText>
          </Button>
        </CardContent>
      </Card>
    </StyledView>
  );
};

export default NotFound;
