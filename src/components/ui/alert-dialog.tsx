import * as React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { styled } from "nativewind";
import { cva, type VariantProps } from "class-variance-authority"; // For button variants

// Assume cn utility is available, similar to how it's used in web projects
// You might need to adjust the path based on your project structure.
import { cn } from "@/lib/utils"; // Path might need adjustment to e.g., ../lib/utils

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledPressable = styled(Pressable);

// --- Simplified Button Variants for internal use in AlertDialog ---
// This mimics the buttonVariants from your @/components/ui/button
// You might eventually want to import a shared Button component if converted.
const buttonVariants = cva(
  "flex-row items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-blue-500 text-white", // Adjusted for RN blue button
        destructive: "bg-red-500 text-white", // Adjusted for RN red button
        outline: "border border-gray-300 bg-transparent text-gray-700",
        secondary: "bg-gray-200 text-gray-800",
        ghost: "bg-transparent text-gray-700",
        link: "text-blue-500 underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
// --- End Simplified Button Variants ---

interface AlertDialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext = React.createContext<AlertDialogContextType | undefined>(
  undefined
);

// AlertDialog (Root)
interface AlertDialogProps {
  children: React.ReactNode;
  open?: boolean; // Controlled open state
  onOpenChange?: (open: boolean) => void; // Controlled open change handler
}

const AlertDialog = ({ children, open: controlledOpen, onOpenChange }: AlertDialogProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = controlledOpen !== undefined ? onOpenChange! : setUncontrolledOpen;

  const contextValue: AlertDialogContextType = {
    open,
    setOpen,
  };

  return (
    <AlertDialogContext.Provider value={contextValue}>
      {children}
    </AlertDialogContext.Provider>
  );
};

// AlertDialogTrigger
interface AlertDialogTriggerProps {
  children: React.ReactNode;
  className?: string; // Not used directly, but kept for consistency
}

const AlertDialogTrigger = ({ children }: AlertDialogTriggerProps) => {
  const context = React.useContext(AlertDialogContext);
  if (!context) {
    throw new Error("AlertDialogTrigger must be used within an AlertDialog");
  }

  // Find the TouchableOpacity or other pressable component if children is React Element
  // This approach is more flexible if children is a complex component
  const child = React.Children.only(children) as React.ReactElement<any>;

  return React.cloneElement(child, {
    onPress: () => {
      child.props.onPress?.(); // Call original onPress if it exists
      context.setOpen(true);
    },
  });
};

// AlertDialogPortal - Not directly convertible as RN handles modals differently
// The Modal itself acts as the portal.

// AlertDialogOverlay
const AlertDialogOverlay = styled(
  React.forwardRef<
    View, // Ref type for View
    React.ComponentPropsWithoutRef<typeof View>
  >(({ className, ...props }, ref) => (
    <StyledView
      ref={ref}
      className={cn(
        "absolute inset-0 z-50 bg-black/80", // Fixed, covers full screen
        className
      )}
      {...props}
    />
  ))
);
AlertDialogOverlay.displayName = "AlertDialogOverlay";

// AlertDialogContent
const AlertDialogContent = styled(
  React.forwardRef<
    View, // Ref type for View
    React.ComponentPropsWithoutRef<typeof View>
  >(({ className, children, ...props }, ref) => {
    const context = React.useContext(AlertDialogContext);
    if (!context) {
      throw new Error("AlertDialogContent must be used within an AlertDialog");
    }

    return (
      <Modal
        transparent={true}
        visible={context.open}
        onRequestClose={() => context.setOpen(false)} // Android back button
        animationType="fade" // For overlay fade-in/out
      >
        <StyledPressable
          className="flex-1 justify-center items-center bg-black/80" // Overlay for touch dismissal (optional based on Radix behavior)
          // On AlertDialog, Radix usually doesn't close on overlay click by default,
          // so this Pressable mainly acts as the backdrop.
          // You could uncomment the onPress below if you want overlay dismissal.
          // onPress={() => context.setOpen(false)}
        >
          <StyledView
            ref={ref}
            className={cn(
              "z-50 w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-lg", // Basic styling
              className
            )}
            // Prevent immediate closing if content area is tapped
            onStartShouldSetResponder={() => true}
            {...props}
          >
            {children}
          </StyledView>
        </StyledPressable>
      </Modal>
    );
  })
);
AlertDialogContent.displayName = "AlertDialogContent";

// AlertDialogHeader
const AlertDialogHeader = styled(
  ({ className, ...props }: React.ComponentProps<typeof StyledView>) => (
    <StyledView
      className={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        className
      )}
      {...props}
    />
  )
);
AlertDialogHeader.displayName = "AlertDialogHeader";

// AlertDialogFooter
const AlertDialogFooter = styled(
  ({ className, ...props }: React.ComponentProps<typeof StyledView>) => (
    <StyledView
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", // mt-4 added for spacing
        className
      )}
      {...props}
    />
  )
);
AlertDialogFooter.displayName = "AlertDialogFooter";

// AlertDialogTitle
const AlertDialogTitle = styled(
  React.forwardRef<
    Text, // Ref type for Text
    React.ComponentPropsWithoutRef<typeof Text>
  >(({ className, ...props }, ref) => (
    <StyledText
      ref={ref}
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  ))
);
AlertDialogTitle.displayName = "AlertDialogTitle";

// AlertDialogDescription
const AlertDialogDescription = styled(
  React.forwardRef<
    Text, // Ref type for Text
    React.ComponentPropsWithoutRef<typeof Text>
  >(({ className, ...props }, ref) => (
    <StyledText
      ref={ref}
      className={cn("text-sm text-gray-500", className)}
      {...props}
    />
  ))
);
AlertDialogDescription.displayName = "AlertDialogDescription";

// AlertDialogAction
const AlertDialogAction = styled(
  React.forwardRef<
    TouchableOpacity, // Ref type for TouchableOpacity
    React.ComponentPropsWithoutRef<typeof TouchableOpacity> &
      VariantProps<typeof buttonVariants>
  >(({ className, variant, size, ...props }, ref) => {
    const context = React.useContext(AlertDialogContext);
    if (!context) {
      throw new Error("AlertDialogAction must be used within an AlertDialog");
    }
    return (
      <StyledTouchableOpacity
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        onPress={() => {
          props.onPress?.(); // Call original onPress
          context.setOpen(false); // Close modal
        }}
        {...props}
      >
        {typeof props.children === 'string' ? (
          <StyledText className={cn(buttonVariants({ variant, size }).split(' ').find(cls => cls.startsWith('text-')))}>{props.children}</StyledText>
        ) : (
          props.children
        )}
      </StyledTouchableOpacity>
    );
  })
);
AlertDialogAction.displayName = "AlertDialogAction";

// AlertDialogCancel
const AlertDialogCancel = styled(
  React.forwardRef<
    TouchableOpacity, // Ref type for TouchableOpacity
    React.ComponentPropsWithoutRef<typeof TouchableOpacity> &
      VariantProps<typeof buttonVariants>
  >(({ className, ...props }, ref) => {
    const context = React.useContext(AlertDialogContext);
    if (!context) {
      throw new Error("AlertDialogCancel must be used within an AlertDialog");
    }
    return (
      <StyledTouchableOpacity
        ref={ref}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "mt-2 sm:mt-0", // Adjusted margin for RN flexbox
          className
        )}
        onPress={() => {
          props.onPress?.(); // Call original onPress
          context.setOpen(false); // Close modal
        }}
        {...props}
      >
        {typeof props.children === 'string' ? (
          <StyledText className={cn(buttonVariants({ variant: 'outline' }).split(' ').find(cls => cls.startsWith('text-')))}>{props.children}</StyledText>
        ) : (
          props.children
        )}
      </StyledTouchableOpacity>
    );
  })
);
AlertDialogCancel.displayName = "AlertDialogCancel";

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  // AlertDialogPortal and AlertDialogOverlay are handled internally by Modal and StyledPressable/View
};
