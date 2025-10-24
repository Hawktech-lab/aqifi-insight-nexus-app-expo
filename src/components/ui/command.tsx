import * as React from "react"
import { View, TextInput, ScrollView, TouchableOpacity, Text } from "react-native"
import { Search } from "lucide-react-native"

import { cn } from "../../lib/utils"
import { Dialog, DialogContent } from "../../components/ui/dialog"

interface CommandProps {
  children: React.ReactNode;
  className?: string;
}

const Command: React.FC<CommandProps> = ({ children, className }) => (
  <View
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    )}
  >
    {children}
  </View>
)

interface CommandDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const CommandDialog: React.FC<CommandDialogProps> = ({ children, ...props }) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

interface CommandInputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  className?: string;
}

const CommandInput: React.FC<CommandInputProps> = ({ 
  className, 
  placeholder,
  value,
  onChangeText,
  ...props 
}) => (
  <View className="flex items-center border-b px-3">
    <Search size={16} color="#6b7280" style={{ marginRight: 8 }} />
    <TextInput
      className={cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor="#6b7280"
      {...props}
    />
  </View>
)

interface CommandListProps {
  children: React.ReactNode;
  className?: string;
}

const CommandList: React.FC<CommandListProps> = ({ children, className }) => (
  <ScrollView
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    showsVerticalScrollIndicator={false}
  >
    {children}
  </ScrollView>
)

interface CommandEmptyProps {
  children: React.ReactNode;
  className?: string;
}

const CommandEmpty: React.FC<CommandEmptyProps> = ({ children, className }) => (
  <View
    className={cn("py-6 text-center text-sm", className)}
  >
    <Text className="text-sm text-muted-foreground">{children}</Text>
  </View>
)

interface CommandGroupProps {
  children: React.ReactNode;
  className?: string;
  heading?: string;
}

const CommandGroup: React.FC<CommandGroupProps> = ({ children, className, heading }) => (
  <View
    className={cn(
      "overflow-hidden p-1 text-foreground",
      className
    )}
  >
    {heading && (
      <View className="px-2 py-1.5">
        <Text className="text-xs font-medium text-muted-foreground">{heading}</Text>
      </View>
    )}
    {children}
  </View>
)

interface CommandSeparatorProps {
  className?: string;
}

const CommandSeparator: React.FC<CommandSeparatorProps> = ({ className }) => (
  <View
    className={cn("-mx-1 h-px bg-border", className)}
  />
)

interface CommandItemProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
  disabled?: boolean;
}

const CommandItem: React.FC<CommandItemProps> = ({ 
  children, 
  className, 
  onPress, 
  disabled = false 
}) => (
  <TouchableOpacity
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
  >
    <Text className="text-sm">{children}</Text>
  </TouchableOpacity>
)

interface CommandShortcutProps {
  children: React.ReactNode;
  className?: string;
}

const CommandShortcut: React.FC<CommandShortcutProps> = ({ children, className }) => (
  <Text
    className={cn(
      "ml-auto text-xs tracking-widest text-muted-foreground",
      className
    )}
  >
    {children}
  </Text>
)

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
