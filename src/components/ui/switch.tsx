import * as React from "react"
import { TouchableOpacity, View } from "react-native"

import { cn } from "../../lib/utils"

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const Switch = React.forwardRef<View, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled = false, ...props }, ref) => (
    <TouchableOpacity
      className={cn(
        "inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-input",
        disabled ? "opacity-50" : "",
        className
      )}
      onPress={() => !disabled && onCheckedChange?.(!checked)}
      disabled={disabled}
      activeOpacity={0.7}
      ref={ref}
      {...props}
    >
      <View
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </TouchableOpacity>
  )
)
Switch.displayName = "Switch"

export { Switch }
