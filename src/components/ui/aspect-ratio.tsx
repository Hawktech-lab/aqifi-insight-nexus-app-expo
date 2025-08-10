import * as React from "react";
import { View } from "react-native";
import { styled } from "nativewind"; // Assuming Nativewind is set up

// You might not need 'cn' for this simple component unless you want to combine
// more complex styles, but keeping for consistency with other conversions.
import { cn } from "@/lib/utils"; // Adjust path as needed

// Define the styled View component
const StyledView = styled(View);

interface AspectRatioProps extends React.ComponentPropsWithoutRef<typeof View> {
  ratio?: number; // The desired aspect ratio (width / height)
}

/**
 * A simple AspectRatio component for React Native.
 * It uses the `aspectRatio` style property to maintain the given ratio.
 *
 * @param {number} ratio - The desired aspect ratio (e.g., 16 / 9, 4 / 3, 1). Defaults to 1.
 * @param {string} className - Nativewind classes for styling.
 * @param {React.ReactNode} children - The content to be rendered inside the aspect ratio container.
 */
const AspectRatio = React.forwardRef<View, AspectRatioProps>(
  ({ ratio = 1, className, children, style, ...props }, ref) => {
    return (
      <StyledView
        ref={ref}
        className={cn(className)} // Apply Nativewind classes
        style={[{ aspectRatio: ratio }, style]} // Apply aspectRatio style
        {...props}
      >
        {children}
      </StyledView>
    );
  }
);

AspectRatio.displayName = "AspectRatio";

export { AspectRatio };
