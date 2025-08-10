import * as React from "react"
import { View, Modal, TouchableOpacity, Text, PanGestureHandler, PanGestureHandlerGestureEvent } from "react-native"
import { useSharedValue, useAnimatedGestureHandler, useAnimatedStyle, runOnJS, withSpring } from "react-native-reanimated"
import Animated, { useAnimatedStyle as useAnimatedStyleReanimated } from "react-native-reanimated"

import { cn } from "@/lib/utils"

interface DrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  shouldScaleBackground?: boolean;
}

interface DrawerTriggerProps {
  children: React.ReactNode;
  onPress: () => void;
  className?: string;
}

interface DrawerContentProps {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

interface DrawerOverlayProps {
  className?: string;
  onPress?: () => void;
}

interface DrawerHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DrawerFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface DrawerTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DrawerDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface DrawerCloseProps {
  onPress: () => void;
  className?: string;
}

const Drawer: React.FC<DrawerProps> = ({ 
  open = false, 
  onOpenChange, 
  children, 
  shouldScaleBackground = true 
}) => {
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={() => onOpenChange?.(false)}
    >
      {children}
    </Modal>
  );
};

const DrawerTrigger: React.FC<DrawerTriggerProps> = ({ 
  children, 
  onPress, 
  className 
}) => {
  return (
    <TouchableOpacity
      className={className}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );
};

const DrawerOverlay: React.FC<DrawerOverlayProps> = ({ 
  className, 
  onPress 
}) => (
  <TouchableOpacity
    className={cn("absolute inset-0 z-50 bg-black/80", className)}
    onPress={onPress}
    activeOpacity={1}
  />
);

const DrawerContent: React.FC<DrawerContentProps> = ({ 
  children, 
  className, 
  onClose 
}) => {
  const translateY = useSharedValue(0);
  const { height: screenHeight } = require('react-native').Dimensions.get('window');

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: (_, context: any) => {
      context.startY = translateY.value;
    },
    onActive: (event, context: any) => {
      const newTranslateY = context.startY + event.translationY;
      translateY.value = Math.max(0, newTranslateY);
    },
    onEnd: (event) => {
      if (event.velocityY > 500 || event.translationY > 100) {
        translateY.value = withSpring(screenHeight, { damping: 20 });
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20 });
      }
    },
  });

  const animatedStyle = useAnimatedStyleReanimated(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <View className="flex-1 justify-end">
      <DrawerOverlay onPress={onClose} />
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
            className
          )}
          style={animatedStyle}
        >
          <View className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const DrawerHeader: React.FC<DrawerHeaderProps> = ({ children, className }) => (
  <View
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
  >
    {children}
  </View>
);

const DrawerFooter: React.FC<DrawerFooterProps> = ({ children, className }) => (
  <View
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
  >
    {children}
  </View>
);

const DrawerTitle: React.FC<DrawerTitleProps> = ({ children, className }) => (
  <Text
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
  >
    {children}
  </Text>
);

const DrawerDescription: React.FC<DrawerDescriptionProps> = ({ children, className }) => (
  <Text
    className={cn("text-sm text-muted-foreground", className)}
  >
    {children}
  </Text>
);

const DrawerClose: React.FC<DrawerCloseProps> = ({ onPress, className }) => (
  <TouchableOpacity
    className={className}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text>Close</Text>
  </TouchableOpacity>
);

// Placeholder components for compatibility
const DrawerPortal = Drawer;

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
