import * as React from "react"
import { View, TouchableOpacity, Text, ScrollView } from "react-native"
import { cva } from "class-variance-authority"
import { ChevronDown } from "lucide-react-native"

import { cn } from "@/lib/utils"

interface NavigationMenuProps {
  children: React.ReactNode;
  className?: string;
}

interface NavigationMenuListProps {
  children: React.ReactNode;
  className?: string;
}

interface NavigationMenuItemProps {
  children: React.ReactNode;
  className?: string;
}

interface NavigationMenuTriggerProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
  isOpen?: boolean;
}

interface NavigationMenuContentProps {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
}

interface NavigationMenuLinkProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
}

interface NavigationMenuViewportProps {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
}

interface NavigationMenuIndicatorProps {
  className?: string;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({ 
  children, 
  className 
}) => (
  <View
    className={cn(
      "relative z-10 flex max-w-max flex-1 items-center justify-center",
      className
    )}
  >
    {children}
  </View>
);

const NavigationMenuList: React.FC<NavigationMenuListProps> = ({ 
  children, 
  className 
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    className={cn(
      "group flex flex-1 list-none items-center justify-center space-x-1",
      className
    )}
  >
    {children}
  </ScrollView>
);

const NavigationMenuItem: React.FC<NavigationMenuItemProps> = ({ 
  children, 
  className 
}) => (
  <View className={className}>
    {children}
  </View>
);

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
);

const NavigationMenuTrigger: React.FC<NavigationMenuTriggerProps> = ({ 
  className, 
  children, 
  onPress, 
  isOpen = false 
}) => (
  <TouchableOpacity
    className={cn(navigationMenuTriggerStyle(), "group", className)}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text className="text-sm font-medium">{children}</Text>
    <ChevronDown
      size={12}
      color="#6b7280"
      style={{ 
        marginLeft: 4, 
        transform: [{ rotate: isOpen ? '180deg' : '0deg' }] 
      }}
    />
  </TouchableOpacity>
);

const NavigationMenuContent: React.FC<NavigationMenuContentProps> = ({ 
  children, 
  className, 
  isOpen = false 
}) => {
  if (!isOpen) return null;
  
  return (
    <View
      className={cn(
        "left-0 top-0 w-full",
        className
      )}
    >
      {children}
    </View>
  );
};

const NavigationMenuLink: React.FC<NavigationMenuLinkProps> = ({ 
  children, 
  className, 
  onPress 
}) => (
  <TouchableOpacity
    className={className}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text className="text-sm">{children}</Text>
  </TouchableOpacity>
);

const NavigationMenuViewport: React.FC<NavigationMenuViewportProps> = ({ 
  children, 
  className, 
  isOpen = false 
}) => {
  if (!isOpen) return null;
  
  return (
    <View className={cn("absolute left-0 top-full flex justify-center")}>
      <View
        className={cn(
          "origin-top-center relative mt-1.5 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg",
          className
        )}
      >
        {children}
      </View>
    </View>
  );
};

const NavigationMenuIndicator: React.FC<NavigationMenuIndicatorProps> = ({ 
  className 
}) => (
  <View
    className={cn(
      "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
      className
    )}
  >
    <View className="relative top-[60%] h-2 w-2 rotate-[45deg] rounded-tl-sm bg-border shadow-md" />
  </View>
);

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuViewport,
  NavigationMenuIndicator,
  navigationMenuTriggerStyle,
}
