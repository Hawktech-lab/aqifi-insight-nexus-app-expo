import * as React from "react"
import { TouchableOpacity, View } from "react-native"
import { Check } from "lucide-react-native"

import { cn } from "@/lib/utils"

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const Checkbox = React.forwardRef<View, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, disabled = false, ...props }, ref) => (
    <TouchableOpacity
      ref={ref}
      className={cn(
        "h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-transparent",
        disabled ? "opacity-50" : "",
        className
      )}
      onPress={() => !disabled && onCheckedChange?.(!checked)}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      {checked && (
        <View className="flex items-center justify-center text-current">
          <Check size={16} color="white" />
        </View>
      )}
    </TouchableOpacity>
  )
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
