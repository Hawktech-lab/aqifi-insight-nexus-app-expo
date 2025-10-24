import * as React from "react"
import { View, TouchableOpacity, Text, Modal } from "react-native"
import { Check, ChevronRight, Circle } from "lucide-react-native"

import { cn } from "../../lib/utils"

interface MenubarProps {
  children: React.ReactNode;
  className?: string;
}

interface MenubarTriggerProps {
  children: React.ReactNode;
  onPress: () => void;
  className?: string;
}

interface MenubarContentProps {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  alignOffset?: number;
  sideOffset?: number;
  onClose?: () => void;
}

interface MenubarItemProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
  disabled?: boolean;
  inset?: boolean;
}

interface MenubarCheckboxItemProps {
  children: React.ReactNode;
  className?: string;
  checked?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

interface MenubarRadioItemProps {
  children: React.ReactNode;
  className?: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
}

interface MenubarLabelProps {
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
}

interface MenubarSeparatorProps {
  className?: string;
}

interface MenubarShortcutProps {
  children: React.ReactNode;
  className?: string;
}

interface MenubarSubTriggerProps {
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
  onPress?: () => void;
}

interface MenubarSubContentProps {
  children: React.ReactNode;
  className?: string;
}

const Menubar: React.FC<MenubarProps> = ({ children, className }) => (
  <View
    className={cn(
      "flex h-10 items-center space-x-1 rounded-md border bg-background p-1",
      className
    )}
  >
    {children}
  </View>
);

const MenubarTrigger: React.FC<MenubarTriggerProps> = ({ 
  children, 
  onPress, 
  className 
}) => (
  <TouchableOpacity
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      className
    )}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text className="text-sm font-medium">{children}</Text>
  </TouchableOpacity>
);

const MenubarContent: React.FC<MenubarContentProps> = ({ 
  children, 
  className, 
  align = "start", 
  alignOffset = -4, 
  sideOffset = 8, 
  onClose 
}) => (
  <Modal
    visible={true}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View className="flex-1 justify-center items-center p-4">
      <View className="absolute inset-0 bg-black/50" onTouchEnd={onClose} />
      <View
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          className
        )}
      >
        {children}
      </View>
    </View>
  </Modal>
);

const MenubarItem: React.FC<MenubarItemProps> = ({ 
  children, 
  className, 
  onPress, 
  disabled = false, 
  inset = false 
}) => (
  <TouchableOpacity
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      disabled && "opacity-50",
      className
    )}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
  >
    <Text className="text-sm">{children}</Text>
  </TouchableOpacity>
);

const MenubarCheckboxItem: React.FC<MenubarCheckboxItemProps> = ({ 
  children, 
  className, 
  checked = false, 
  onPress, 
  disabled = false 
}) => (
  <TouchableOpacity
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      disabled && "opacity-50",
      className
    )}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
  >
    <View className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {checked && <Check size={14} color="#3b82f6" />}
    </View>
    <Text className="text-sm">{children}</Text>
  </TouchableOpacity>
);

const MenubarRadioItem: React.FC<MenubarRadioItemProps> = ({ 
  children, 
  className, 
  value, 
  onPress, 
  disabled = false 
}) => (
  <TouchableOpacity
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      disabled && "opacity-50",
      className
    )}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
  >
    <View className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <Circle size={14} color="#3b82f6" />
    </View>
    <Text className="text-sm">{children}</Text>
  </TouchableOpacity>
);

const MenubarLabel: React.FC<MenubarLabelProps> = ({ 
  children, 
  className, 
  inset = false 
}) => (
  <View
    className={cn(
      "px-2 py-1.5 text-sm font-semibold text-muted-foreground",
      inset && "pl-8",
      className
    )}
  >
    <Text className="text-sm font-semibold text-muted-foreground">{children}</Text>
  </View>
);

const MenubarSeparator: React.FC<MenubarSeparatorProps> = ({ className }) => (
  <View
    className={cn("-mx-1 my-1 h-px bg-border", className)}
  />
);

const MenubarShortcut: React.FC<MenubarShortcutProps> = ({ 
  children, 
  className 
}) => (
  <Text
    className={cn(
      "ml-auto text-xs tracking-widest text-muted-foreground",
      className
    )}
  >
    {children}
  </Text>
);

const MenubarSubTrigger: React.FC<MenubarSubTriggerProps> = ({ 
  children, 
  className, 
  inset = false, 
  onPress 
}) => (
  <TouchableOpacity
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    )}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text className="text-sm flex-1">{children}</Text>
    <ChevronRight size={16} color="#6b7280" />
  </TouchableOpacity>
);

const MenubarSubContent: React.FC<MenubarSubContentProps> = ({ 
  children, 
  className 
}) => (
  <View
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground",
      className
    )}
  >
    {children}
  </View>
);

// Placeholder components for compatibility
const MenubarMenu = Menubar;
const MenubarGroup = Menubar;
const MenubarPortal = Menubar;
const MenubarSub = Menubar;
const MenubarRadioGroup = Menubar;

export {
  Menubar,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarCheckboxItem,
  MenubarRadioItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarShortcut,
  MenubarMenu,
  MenubarGroup,
  MenubarPortal,
  MenubarSub,
  MenubarRadioGroup,
  MenubarSubTrigger,
  MenubarSubContent,
}
