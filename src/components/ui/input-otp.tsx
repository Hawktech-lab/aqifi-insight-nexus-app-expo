import * as React from "react"
import { View, TextInput, Text } from "react-native"
import { Dot } from "lucide-react-native"

import { cn } from "@/lib/utils"

interface InputOTPProps {
  value?: string;
  onChange?: (value: string) => void;
  length?: number;
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
}

interface InputOTPGroupProps {
  children: React.ReactNode;
  className?: string;
}

interface InputOTPSlotProps {
  index: number;
  className?: string;
  value?: string;
  isActive?: boolean;
  onPress?: () => void;
}

interface InputOTPSeparatorProps {
  className?: string;
}

const InputOTP: React.FC<InputOTPProps> = ({ 
  value = "", 
  onChange, 
  length = 6, 
  className, 
  containerClassName, 
  disabled = false 
}) => {
  const [otpValue, setOtpValue] = React.useState(value);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRefs = React.useRef<TextInput[]>([]);

  React.useEffect(() => {
    setOtpValue(value);
  }, [value]);

  const handleChange = (text: string, index: number) => {
    const newOtpValue = otpValue.split('');
    newOtpValue[index] = text;
    const newValue = newOtpValue.join('');
    
    setOtpValue(newValue);
    onChange?.(newValue);

    // Move to next input if character entered
    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Move to previous input on backspace
    if (e.nativeEvent.key === 'Backspace' && !otpValue[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    }
  };

  const handleFocus = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <View
      className={cn(
        "flex items-center gap-2",
        disabled && "opacity-50",
        containerClassName
      )}
    >
      {Array.from({ length }, (_, index) => (
        <InputOTPSlot
          key={index}
          index={index}
          value={otpValue[index] || ''}
          isActive={activeIndex === index}
          onPress={() => inputRefs.current[index]?.focus()}
        >
          <TextInput
            ref={(ref) => {
              if (ref) inputRefs.current[index] = ref;
            }}
            className={cn(
              "h-10 w-10 text-center text-sm border border-input rounded-md",
              activeIndex === index && "ring-2 ring-ring ring-offset-background",
              disabled && "cursor-not-allowed",
              className
            )}
            value={otpValue[index] || ''}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onFocus={() => handleFocus(index)}
            maxLength={1}
            keyboardType="numeric"
            editable={!disabled}
            selectTextOnFocus
            style={{ textAlign: 'center' }}
          />
        </InputOTPSlot>
      ))}
    </View>
  );
};

const InputOTPGroup: React.FC<InputOTPGroupProps> = ({ children, className }) => (
  <View className={cn("flex items-center", className)}>
    {children}
  </View>
);

const InputOTPSlot: React.FC<InputOTPSlotProps> = ({ 
  index, 
  className, 
  value, 
  isActive, 
  onPress 
}) => (
  <View
    className={cn(
      "relative flex h-10 w-10 items-center justify-center border border-input text-sm transition-all",
      isActive && "z-10 ring-2 ring-ring ring-offset-background",
      className
    )}
    onTouchEnd={onPress}
  >
    <Text className="text-sm">{value}</Text>
    {isActive && (
      <View className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <View className="h-4 w-px bg-foreground" />
      </View>
    )}
  </View>
);

const InputOTPSeparator: React.FC<InputOTPSeparatorProps> = ({ className }) => (
  <View className={className}>
    <Dot size={16} color="#6b7280" />
  </View>
);

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
