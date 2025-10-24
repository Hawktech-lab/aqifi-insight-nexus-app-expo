import * as React from "react";
import { View, Text } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { styled } from "nativewind";

// Assume cn utility is available, similar to how it's used in web projects
// You might need to adjust the path based on your project structure.
import { cn } from "../../lib/utils"; // Path might need adjustment to e.g., ../lib/utils

const alertVariants = cva(
  "flex w-full rounded-lg border p-4", // 'relative' and specific SVG selectors removed
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface AlertProps
  extends React.ComponentPropsWithoutRef<typeof View>,
    VariantProps<typeof alertVariants> {}

const Alert = styled(
  React.forwardRef<View, AlertProps>(
    ({ className, variant, children, ...props }, ref) => (
      <StyledView
        ref={ref}
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {/*
          In React Native, direct child selectors like `&>svg` are not supported.
          If an SVG icon is intended to be placed as a direct child,
          you would typically structure it with a wrapper View or apply styles
          directly to the icon component if it supports `className`.
          The padding and translation previously handled by CSS selectors
          would need to be explicitly managed on individual child components.
        */}
        {children}
      </StyledView>
    )
  )
);
Alert.displayName = "Alert";

interface AlertTitleProps
  extends React.ComponentPropsWithoutRef<typeof Text> {}

const AlertTitle = styled(
  React.forwardRef<Text, AlertTitleProps>(({ className, ...props }, ref) => (
    <StyledText
      ref={ref}
      className={cn("mb-1 text-base font-medium leading-none tracking-tight", className)} // Adjusted to text-base for RN
      {...props}
    />
  ))
);
AlertTitle.displayName = "AlertTitle";

interface AlertDescriptionProps
  extends React.ComponentPropsWithoutRef<typeof Text> {}

const AlertDescription = styled(
  React.forwardRef<Text, AlertDescriptionProps>(
    ({ className, ...props }, ref) => (
      <StyledText
        ref={ref}
        className={cn("text-sm opacity-90", className)} // Adjusted to text-sm for RN
        {...props}
      />
    )
  )
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
