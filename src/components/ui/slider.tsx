import * as React from "react"
import { View, ViewProps } from "react-native"
import { PanGestureHandler, PanGestureHandlerGestureEvent } from "react-native-gesture-handler"
import Animated, { 
  useAnimatedGestureHandler, 
  useAnimatedStyle, 
  useSharedValue,
  runOnJS
} from "react-native-reanimated"

import { cn } from "@/lib/utils"

interface SliderProps extends ViewProps {
  value?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

const Slider = React.forwardRef<View, SliderProps>(
  ({ 
    className, 
    value = 0, 
    onValueChange, 
    min = 0, 
    max = 100, 
    step = 1,
    disabled = false,
    ...props 
  }, ref) => {
    const translateX = useSharedValue(0);
    const sliderWidth = useSharedValue(0);

    React.useEffect(() => {
      const percentage = ((value - min) / (max - min)) * 100;
      translateX.value = (percentage / 100) * sliderWidth.value;
    }, [value, min, max, sliderWidth.value]);

    const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
      onStart: (_, context: any) => {
        context.startX = translateX.value;
      },
      onActive: (event, context: any) => {
        if (disabled) return;
        
        const newTranslateX = context.startX + event.translationX;
        const clampedTranslateX = Math.max(0, Math.min(sliderWidth.value, newTranslateX));
        translateX.value = clampedTranslateX;
        
        const percentage = (clampedTranslateX / sliderWidth.value) * 100;
        const newValue = min + (percentage / 100) * (max - min);
        const steppedValue = Math.round(newValue / step) * step;
        
        runOnJS(onValueChange)?.(steppedValue);
      },
    });

    const thumbStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateX: translateX.value }],
      };
    });

    const rangeStyle = useAnimatedStyle(() => {
      return {
        width: `${(translateX.value / sliderWidth.value) * 100}%`,
      };
    });

    return (
      <View
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        onLayout={(event) => {
          sliderWidth.value = event.nativeEvent.layout.width - 20; // Account for thumb width
        }}
        {...props}
      >
        <View className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <Animated.View 
            className="absolute h-full bg-primary" 
            style={rangeStyle}
          />
        </View>
        <PanGestureHandler onGestureEvent={gestureHandler} enabled={!disabled}>
          <Animated.View
            className={cn(
              "absolute h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              disabled ? "opacity-50" : ""
            )}
            style={thumbStyle}
          />
        </PanGestureHandler>
      </View>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
