import * as React from "react"
import { View, ViewProps } from "react-native"

import { cn } from "../../lib/utils"

interface ProgressProps extends ViewProps {
  value?: number;
}

const Progress = React.forwardRef<View, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <View
        className="h-full bg-primary transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </View>
  )
)
Progress.displayName = "Progress"

export { Progress }
