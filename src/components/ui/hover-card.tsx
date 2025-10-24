import * as React from "react"
import { View, TouchableOpacity, Modal } from "react-native"

import { cn } from "../../lib/utils"

interface HoverCardProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface HoverCardTriggerProps {
  children: React.ReactNode;
  onPress: () => void;
  className?: string;
}

interface HoverCardContentProps {
  children: React.ReactNode;
  className?: string;
  align?: "center" | "start" | "end";
  sideOffset?: number;
  onClose?: () => void;
}

const HoverCard: React.FC<HoverCardProps> = ({ 
  children, 
  open = false, 
  onOpenChange 
}) => {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => onOpenChange?.(false)}
    >
      {children}
    </Modal>
  );
};

const HoverCardTrigger: React.FC<HoverCardTriggerProps> = ({ 
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

const HoverCardContent: React.FC<HoverCardContentProps> = ({ 
  children, 
  className, 
  align = "center", 
  sideOffset = 4, 
  onClose 
}) => (
  <View className="flex-1 justify-center items-center p-4">
    <View className="absolute inset-0 bg-black/50" onTouchEnd={onClose} />
    <View
      className={cn(
        "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
        className
      )}
    >
      {children}
    </View>
  </View>
);

export { HoverCard, HoverCardTrigger, HoverCardContent }
