import * as React from "react"
import { View, TouchableOpacity, Text } from "react-native"

import { cn } from "@/lib/utils"

interface TabsProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  onPress: () => void;
  isActive?: boolean;
  className?: string;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ 
  value, 
  onValueChange, 
  children, 
  className 
}) => {
  const [activeTab, setActiveTab] = React.useState(value);

  const handleValueChange = (newValue: string) => {
    setActiveTab(newValue);
    onValueChange?.(newValue);
  };

  return (
    <View className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            activeTab,
            onValueChange: handleValueChange,
          });
        }
        return child;
      })}
    </View>
  );
};

const TabsList: React.FC<TabsListProps> = ({ children, className }) => (
  <View
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
  >
    {children}
  </View>
);

const TabsTrigger: React.FC<TabsTriggerProps> = ({ 
  children, 
  onPress, 
  isActive = false, 
  className 
}) => (
  <TouchableOpacity
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      isActive ? "bg-background text-foreground shadow-sm" : "",
      className
    )}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text className={isActive ? "text-foreground" : "text-muted-foreground"}>
      {children}
    </Text>
  </TouchableOpacity>
);

const TabsContent: React.FC<TabsContentProps> = ({ 
  children, 
  isActive = false, 
  className 
}) => {
  if (!isActive) return null;
  
  return (
    <View
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      {children}
    </View>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent }
