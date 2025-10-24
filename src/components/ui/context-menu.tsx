import * as React from "react"
import { View, TouchableOpacity, Text, Modal } from "react-native"
import { Check, ChevronRight, Circle } from "lucide-react-native"

import { cn } from "../../lib/utils"

interface ContextMenuProps {
  children: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

interface ContextMenuTriggerProps {
  children: React.ReactNode;
  onPress: () => void;
  className?: string;
}

interface ContextMenuContentProps {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

interface ContextMenuItemProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
  disabled?: boolean;
  inset?: boolean;
}

interface ContextMenuCheckboxItemProps {
  children: React.ReactNode;
  className?: string;
  checked?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

interface ContextMenuRadioItemProps {
  children: React.ReactNode;
  className?: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
}

interface ContextMenuLabelProps {
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
}

interface ContextMenuSeparatorProps {
  className?: string;
}

interface ContextMenuShortcutProps {
  children: React.ReactNode;
  className?: string;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ children, onOpenChange }) => {
  return <>{children}</>;
};

const ContextMenuTrigger: React.FC<ContextMenuTriggerProps> = ({ 
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

const ContextMenuContent: React.FC<ContextMenuContentProps> = ({ 
  children, 
  className, 
  onClose 
}) => {
  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center p-4">
        <View className="absolute inset-0 bg-black/50" />
        <View
          className={cn(
            "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
            className
          )}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
};

const ContextMenuItem: React.FC<ContextMenuItemProps> = ({ 
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

const ContextMenuCheckboxItem: React.FC<ContextMenuCheckboxItemProps> = ({ 
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

const ContextMenuRadioItem: React.FC<ContextMenuRadioItemProps> = ({ 
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

const ContextMenuLabel: React.FC<ContextMenuLabelProps> = ({ 
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

const ContextMenuSeparator: React.FC<ContextMenuSeparatorProps> = ({ className }) => (
  <View
    className={cn("-mx-1 my-1 h-px bg-border", className)}
  />
);

const ContextMenuShortcut: React.FC<ContextMenuShortcutProps> = ({ 
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

// Placeholder components for compatibility
const ContextMenuGroup = ContextMenu;
const ContextMenuPortal = ContextMenu;
const ContextMenuSub = ContextMenu;
const ContextMenuRadioGroup = ContextMenu;
const ContextMenuSubTrigger = ContextMenuItem;
const ContextMenuSubContent = ContextMenuContent;

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuRadioGroup,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
}
