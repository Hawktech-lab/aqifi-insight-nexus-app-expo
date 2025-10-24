import * as React from "react"
import { View, TouchableOpacity, Text, Modal } from "react-native"
import { Check, ChevronRight, Circle } from "lucide-react-native"

import { cn } from "../../lib/utils"

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  onPress: () => void;
  className?: string;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
  sideOffset?: number;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
  disabled?: boolean;
  inset?: boolean;
}

interface DropdownMenuCheckboxItemProps {
  children: React.ReactNode;
  className?: string;
  checked?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

interface DropdownMenuRadioItemProps {
  children: React.ReactNode;
  className?: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
}

interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
}

interface DropdownMenuSeparatorProps {
  className?: string;
}

interface DropdownMenuShortcutProps {
  children: React.ReactNode;
  className?: string;
}

interface DropdownMenuSubTriggerProps {
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
  onPress?: () => void;
}

interface DropdownMenuSubContentProps {
  children: React.ReactNode;
  className?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ 
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

const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ 
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

const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ 
  children, 
  className, 
  onClose 
}) => {
  return (
    <View className="flex-1 justify-center items-center p-4">
      <View className="absolute inset-0 bg-black/50" onTouchEnd={onClose} />
      <View
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          className
        )}
      >
        {children}
      </View>
    </View>
  );
};

const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
  children, 
  className, 
  onPress, 
  disabled = false, 
  inset = false 
}) => (
  <TouchableOpacity
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
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

const DropdownMenuCheckboxItem: React.FC<DropdownMenuCheckboxItemProps> = ({ 
  children, 
  className, 
  checked = false, 
  onPress, 
  disabled = false 
}) => (
  <TouchableOpacity
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
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

const DropdownMenuRadioItem: React.FC<DropdownMenuRadioItemProps> = ({ 
  children, 
  className, 
  value, 
  onPress, 
  disabled = false 
}) => (
  <TouchableOpacity
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
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

const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({ 
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

const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({ className }) => (
  <View
    className={cn("-mx-1 my-1 h-px bg-border", className)}
  />
);

const DropdownMenuShortcut: React.FC<DropdownMenuShortcutProps> = ({ 
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

const DropdownMenuSubTrigger: React.FC<DropdownMenuSubTriggerProps> = ({ 
  children, 
  className, 
  inset = false, 
  onPress 
}) => (
  <TouchableOpacity
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
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

const DropdownMenuSubContent: React.FC<DropdownMenuSubContentProps> = ({ 
  children, 
  className 
}) => (
  <View
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg",
      className
    )}
  >
    {children}
  </View>
);

// Placeholder components for compatibility
const DropdownMenuGroup = DropdownMenu;
const DropdownMenuPortal = DropdownMenu;
const DropdownMenuSub = DropdownMenu;
const DropdownMenuRadioGroup = DropdownMenu;

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuRadioGroup,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
