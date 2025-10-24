import * as React from "react"
import { View, TouchableOpacity, Text } from "react-native"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react-native"

import { cn } from "../../lib/utils"

interface ToastProviderProps {
  children: React.ReactNode;
}

const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  return <>{children}</>;
};

interface ToastViewportProps {
  children: React.ReactNode;
  className?: string;
}

const ToastViewport: React.FC<ToastViewportProps> = ({ children, className }) => (
  <View
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
  >
    {children}
  </View>
);

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface ToastProps extends VariantProps<typeof toastVariants> {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ 
  className, 
  variant, 
  children, 
  onClose 
}) => {
  return (
    <View
      className={cn(toastVariants({ variant }), className)}
    >
      {children}
      {onClose && (
        <TouchableOpacity
          className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600"
          onPress={onClose}
          activeOpacity={0.7}
        >
          <X size={16} color="#6b7280" />
        </TouchableOpacity>
      )}
    </View>
  )
};

interface ToastActionProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
}

const ToastAction: React.FC<ToastActionProps> = ({ 
  className, 
  children, 
  onPress 
}) => (
  <TouchableOpacity
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text className="text-sm font-medium">{children}</Text>
  </TouchableOpacity>
);

interface ToastCloseProps {
  className?: string;
  onPress?: () => void;
}

const ToastClose: React.FC<ToastCloseProps> = ({ className, onPress }) => (
  <TouchableOpacity
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <X size={16} color="#6b7280" />
  </TouchableOpacity>
);

interface ToastTitleProps {
  children: React.ReactNode;
  className?: string;
}

const ToastTitle: React.FC<ToastTitleProps> = ({ className, children }) => (
  <Text
    className={cn("text-sm font-semibold", className)}
  >
    {children}
  </Text>
);

interface ToastDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const ToastDescription: React.FC<ToastDescriptionProps> = ({ className, children }) => (
  <Text
    className={cn("text-sm opacity-90", className)}
  >
    {children}
  </Text>
);

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
