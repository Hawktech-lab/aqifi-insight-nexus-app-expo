import * as React from "react";
import { View, Image, Text } from "react-native";
import { styled } from "nativewind";

// Assume cn utility is available, similar to how it's used in web projects
// You might need to adjust the path based on your project structure.
import { cn } from "../../lib/utils"; // Path might need adjustment to e.g., ../lib/utils

const StyledView = styled(View);
const StyledImage = styled(Image);
const StyledText = styled(Text);

// Avatar (Root)
interface AvatarProps extends React.ComponentPropsWithoutRef<typeof View> {}

const Avatar = React.forwardRef<View, AvatarProps>(
  ({ className, children, ...props }, ref) => (
    <StyledView
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      {children}
    </StyledView>
  )
);
Avatar.displayName = "Avatar";

// AvatarImage
interface AvatarImageProps extends React.ComponentPropsWithoutRef<typeof Image> {}

const AvatarImage = React.forwardRef<Image, AvatarImageProps>(
  ({ className, source, ...props }, ref) => (
    <StyledImage
      ref={ref}
      className={cn("aspect-square h-full w-full", className)}
      source={source} // 'src' prop in web becomes 'source' in React Native (expects { uri: string } or require())
      {...props}
    />
  )
);
AvatarImage.displayName = "AvatarImage";

// AvatarFallback
interface AvatarFallbackProps extends React.ComponentPropsWithoutRef<typeof View> {}

const AvatarFallback = React.forwardRef<View, AvatarFallbackProps>(
  ({ className, children, ...props }, ref) => (
    <StyledView
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted",
        className
      )}
      {...props}
    >
      {/* If children is a string, render it as Text for accessibility/styling */}
      {typeof children === 'string' ? (
        <StyledText className="text-foreground">{children}</StyledText>
      ) : (
        children
      )}
    </StyledView>
  )
);
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
