import * as React from "react"
import { View, TouchableOpacity, Text, Modal, ScrollView } from "react-native"
import { ChevronDown, Check } from "lucide-react-native"

import { cn } from "@/lib/utils"

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
  onPress: () => void;
  disabled?: boolean;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
  onClose: () => void;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  onPress: () => void;
  isSelected?: boolean;
  className?: string;
}

const Select: React.FC<SelectProps> = ({ 
  value, 
  onValueChange, 
  children, 
  placeholder = "Select option...",
  disabled = false,
  className 
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(value);

  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue);
    onValueChange?.(newValue);
    setIsOpen(false);
  };

  const selectedChild = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.props.value === selectedValue
  );

  return (
    <View className={className}>
      <SelectTrigger
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Text className={selectedValue ? "text-foreground" : "text-muted-foreground"}>
          {selectedChild ? React.isValidElement(selectedChild) ? selectedChild.props.children : null : placeholder}
        </Text>
        <ChevronDown size={16} color="#6b7280" />
      </SelectTrigger>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <SelectContent onClose={() => setIsOpen(false)}>
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                onPress: () => handleValueChange(child.props.value),
                isSelected: child.props.value === selectedValue,
              });
            }
            return child;
          })}
        </SelectContent>
      </Modal>
    </View>
  );
};

const SelectTrigger: React.FC<SelectTriggerProps> = ({ 
  children, 
  className, 
  onPress, 
  disabled 
}) => {
  return (
    <TouchableOpacity
      className={cn(className)}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );
};

const SelectContent: React.FC<SelectContentProps> = ({ 
  children, 
  className, 
  onClose 
}) => {
  return (
    <View className="flex-1 justify-center items-center p-4">
      <View className="absolute inset-0 bg-black/50" />
      <View className={cn(
        "relative bg-background rounded-lg border shadow-lg max-h-80 w-full max-w-sm",
        className
      )}>
        <ScrollView className="p-2">
          {children}
        </ScrollView>
      </View>
    </View>
  );
};

const SelectItem: React.FC<SelectItemProps> = ({ 
  children, 
  onPress, 
  isSelected = false, 
  className 
}) => {
  return (
    <TouchableOpacity
      className={cn(
        "flex-row items-center justify-between px-3 py-2 rounded-md",
        isSelected ? "bg-accent" : "hover:bg-accent/50",
        className
      )}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text className="text-sm">{children}</Text>
      {isSelected && <Check size={16} color="#3b82f6" />}
    </TouchableOpacity>
  );
};

export { Select, SelectTrigger, SelectContent, SelectItem }
