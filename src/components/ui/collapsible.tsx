import * as React from "react"
import { View, TouchableOpacity, Text } from "react-native"
import { ChevronDown } from "lucide-react-native"

import { cn } from "@/lib/utils"

interface CollapsibleProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

interface CollapsibleTriggerProps {
  children: React.ReactNode;
  className?: string;
  onPress: () => void;
  isOpen?: boolean;
}

interface CollapsibleContentProps {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
}

const Collapsible: React.FC<CollapsibleProps> = ({ 
  open = false, 
  onOpenChange, 
  children, 
  className 
}) => {
  const [isOpen, setIsOpen] = React.useState(open);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <View className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            isOpen,
            onPress: () => handleOpenChange(!isOpen),
          });
        }
        return child;
      })}
    </View>
  );
};

const CollapsibleTrigger: React.FC<CollapsibleTriggerProps> = ({ 
  children, 
  className, 
  onPress, 
  isOpen = false 
}) => (
  <TouchableOpacity
    className={cn("flex-row items-center justify-between", className)}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View className="flex-1">
      {children}
    </View>
    <ChevronDown 
      size={16} 
      color="#6b7280" 
      style={{ 
        transform: [{ rotate: isOpen ? '180deg' : '0deg' }] 
      }} 
    />
  </TouchableOpacity>
);

const CollapsibleContent: React.FC<CollapsibleContentProps> = ({ 
  children, 
  className, 
  isOpen = false 
}) => {
  if (!isOpen) return null;
  
  return (
    <View className={cn("overflow-hidden", className)}>
      {children}
    </View>
  );
};

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
