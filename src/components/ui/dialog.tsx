import * as React from "react"
import { Modal, View, TouchableOpacity, Text, ScrollView } from "react-native"
import { X } from "lucide-react-native"

import { cn } from "../../lib/utils"

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => onOpenChange(false)}
    >
      {children}
    </Modal>
  );
};

const DialogTrigger: React.FC<{ children: React.ReactNode; onPress: () => void }> = ({ 
  children, 
  onPress 
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
};

const DialogClose: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <X size={16} color="#6b7280" />
    </TouchableOpacity>
  );
};

const DialogOverlay: React.FC<{ className?: string }> = ({ className }) => (
  <View
    className={cn(
      "absolute inset-0 z-50 bg-black/80",
      className
    )}
  />
);

const DialogContent: React.FC<{ 
  className?: string; 
  children: React.ReactNode;
  onClose?: () => void;
}> = ({ className, children, onClose }) => (
  <View className="flex-1 justify-center items-center p-4">
    <DialogOverlay />
    <View
      className={cn(
        "relative z-50 w-full max-w-lg bg-background rounded-lg border shadow-lg p-6",
        className
      )}
    >
      {children}
      {onClose && (
        <DialogClose onPress={onClose} />
      )}
    </View>
  </View>
);

const DialogHeader: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children
}) => (
  <View
    className={cn(
      "flex flex-col space-y-1.5 mb-4",
      className
    )}
  >
    {children}
  </View>
);

const DialogFooter: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children
}) => (
  <View
    className={cn(
      "flex flex-row justify-end space-x-2 mt-4",
      className
    )}
  >
    {children}
  </View>
);

const DialogTitle: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children
}) => (
  <Text
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
  >
    {children}
  </Text>
);

const DialogDescription: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children
}) => (
  <Text
    className={cn("text-sm text-muted-foreground", className)}
  >
    {children}
  </Text>
);

export {
  Dialog,
  DialogClose,
  DialogTrigger,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
