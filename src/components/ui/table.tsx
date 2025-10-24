import * as React from "react"
import { View, ScrollView, Text } from "react-native"

import { cn } from "../../lib/utils"

const Table = React.forwardRef<
  View,
  React.ComponentProps<typeof View>
>(({ className, children, ...props }, ref) => (
  <View className="relative w-full overflow-auto">
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={cn("w-full", className)}
      {...props}
    >
      <View ref={ref} className="w-full">
        {children}
      </View>
    </ScrollView>
  </View>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  View,
  React.ComponentProps<typeof View>
>(({ className, children, ...props }, ref) => (
  <View ref={ref} className={cn("border-b", className)} {...props}>
    {children}
  </View>
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  View,
  React.ComponentProps<typeof View>
>(({ className, children, ...props }, ref) => (
  <View
    ref={ref}
    className={cn("", className)}
    {...props}
  >
    {children}
  </View>
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  View,
  React.ComponentProps<typeof View>
>(({ className, children, ...props }, ref) => (
  <View
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium",
      className
    )}
    {...props}
  >
    {children}
  </View>
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  View,
  React.ComponentProps<typeof View>
>(({ className, children, ...props }, ref) => (
  <View
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted flex-row",
      className
    )}
    {...props}
  >
    {children}
  </View>
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  View,
  React.ComponentProps<typeof View>
>(({ className, children, ...props }, ref) => (
  <View
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground flex-1 justify-center",
      className
    )}
    {...props}
  >
    <Text className="text-sm font-medium text-muted-foreground">{children}</Text>
  </View>
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  View,
  React.ComponentProps<typeof View>
>(({ className, children, ...props }, ref) => (
  <View
    ref={ref}
    className={cn("p-4 align-middle flex-1 justify-center", className)}
    {...props}
  >
    <Text className="text-sm">{children}</Text>
  </View>
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  View,
  React.ComponentProps<typeof View>
>(({ className, children, ...props }, ref) => (
  <View
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  >
    <Text className="text-sm text-muted-foreground">{children}</Text>
  </View>
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
