import * as React from "react"
import { View, TouchableOpacity, Text } from "react-native"
import { ChevronRight, MoreHorizontal } from "lucide-react-native"

import { cn } from "@/lib/utils"

interface BreadcrumbProps {
  children: React.ReactNode;
  separator?: React.ReactNode;
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ children, className, ...props }) => (
  <View className={className} {...props}>
    {children}
  </View>
)
Breadcrumb.displayName = "Breadcrumb"

interface BreadcrumbListProps {
  children: React.ReactNode;
  className?: string;
}

const BreadcrumbList: React.FC<BreadcrumbListProps> = ({ className, children, ...props }) => (
  <View
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      className
    )}
    {...props}
  >
    {children}
  </View>
)
BreadcrumbList.displayName = "BreadcrumbList"

interface BreadcrumbItemProps {
  children: React.ReactNode;
  className?: string;
}

const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({ className, children, ...props }) => (
  <View
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  >
    {children}
  </View>
)
BreadcrumbItem.displayName = "BreadcrumbItem"

interface BreadcrumbLinkProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
}

const BreadcrumbLink: React.FC<BreadcrumbLinkProps> = ({ className, children, onPress, ...props }) => {
  return (
    <TouchableOpacity
      className={cn("transition-colors hover:text-foreground", className)}
      onPress={onPress}
      activeOpacity={0.7}
      {...props}
    >
      <Text className="text-sm text-muted-foreground">{children}</Text>
    </TouchableOpacity>
  )
}
BreadcrumbLink.displayName = "BreadcrumbLink"

interface BreadcrumbPageProps {
  children: React.ReactNode;
  className?: string;
}

const BreadcrumbPage: React.FC<BreadcrumbPageProps> = ({ className, children, ...props }) => (
  <View
    className={cn("font-normal text-foreground", className)}
    {...props}
  >
    <Text className="font-normal text-foreground">{children}</Text>
  </View>
)
BreadcrumbPage.displayName = "BreadcrumbPage"

interface BreadcrumbSeparatorProps {
  children?: React.ReactNode;
  className?: string;
}

const BreadcrumbSeparator: React.FC<BreadcrumbSeparatorProps> = ({
  children,
  className,
  ...props
}) => (
  <View
    className={cn("[&>svg]:size-3.5", className)}
    {...props}
  >
    {children ?? <ChevronRight size={14} color="#6b7280" />}
  </View>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

interface BreadcrumbEllipsisProps {
  className?: string;
}

const BreadcrumbEllipsis: React.FC<BreadcrumbEllipsisProps> = ({
  className,
  ...props
}) => (
  <View
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal size={16} color="#6b7280" />
  </View>
)
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
