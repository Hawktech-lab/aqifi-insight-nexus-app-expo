import * as React from "react"
import { TextInput, TextInputProps } from "react-native"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<TextInput, TextInputProps>(
  ({ className, style, ...props }, ref) => {
    return (
      <TextInput
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        style={style}
        ref={ref}
        multiline
        textAlignVertical="top"
        placeholderTextColor="#6b7280"
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
