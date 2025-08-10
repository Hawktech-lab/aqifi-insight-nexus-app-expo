import * as React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronDown } from "lucide-react-native"; // Assuming lucide-react-native is installed
import { styled } from "nativewind";

// Assume cn utility is available, similar to how it's used in web projects
// You might need to adjust the path based on your project structure.
// If not available, you can define a simple cn function:
// const cn = (...args: any[]) => args.filter(Boolean).join(' ');
import { cn } from "@/lib/utils"; // Path might need adjustment to e.g., ../lib/utils

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

interface AccordionContextType {
  value: string | string[] | undefined;
  onValueChange: (newValue: string | string[]) => void;
  type?: "single" | "multiple";
}

const AccordionContext = React.createContext<AccordionContextType | undefined>(undefined);

// Accordion (Root)
interface AccordionProps {
  children: React.ReactNode;
  type?: "single" | "multiple";
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  className?: string;
}

const Accordion = styled(({
  children,
  type = "single", // Default to single
  value: controlledValue,
  defaultValue,
  onValueChange,
  className,
}: AccordionProps) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState<string | string[] | undefined>(defaultValue);

  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const handleValueChange = (newValue: string) => {
    let nextValue: string | string[];

    if (type === "single") {
      nextValue = value === newValue ? undefined : newValue; // Toggle if clicking the same item
    } else { // multiple
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(newValue)) {
        nextValue = currentValues.filter((val) => val !== newValue);
      } else {
        nextValue = [...currentValues, newValue];
      }
    }

    if (controlledValue === undefined) {
      setUncontrolledValue(nextValue);
    }
    onValueChange?.(nextValue);
  };

  const contextValue: AccordionContextType = {
    value,
    onValueChange: handleValueChange,
    type,
  };

  return (
    <AccordionContext.Provider value={contextValue}>
      <StyledView className={className}>{children}</StyledView>
    </AccordionContext.Provider>
  );
});

// AccordionItem
interface AccordionItemProps {
  children: React.ReactNode;
  value: string; // Unique value for the item
  className?: string;
}

const AccordionItem = styled(({ children, value, className }: AccordionItemProps) => {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error("AccordionItem must be used within an Accordion");
  }

  const isOpen = Array.isArray(context.value)
    ? context.value.includes(value)
    : context.value === value;

  return (
    <StyledView
      className={cn("border-b", className)}
      data-state={isOpen ? "open" : "closed"} // For Nativewind styling
    >
      {/* Pass isOpen to children so Trigger and Content can react */}
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, {
              __accordionItemValue: value,
              __accordionItemIsOpen: isOpen,
              __accordionOnPress: () => context.onValueChange(value),
            })
          : child
      )}
    </StyledView>
  );
});
AccordionItem.displayName = "AccordionItem";


// AccordionTrigger
interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
  // Internal props passed from AccordionItem
  __accordionItemValue?: string;
  __accordionItemIsOpen?: boolean;
  __accordionOnPress?: () => void;
}

const AccordionTrigger = styled(({
  className,
  children,
  __accordionItemValue,
  __accordionItemIsOpen,
  __accordionOnPress,
  ...props
}: AccordionTriggerProps) => {
  if (__accordionItemValue === undefined || __accordionOnPress === undefined) {
    throw new Error("AccordionTrigger must be used within an AccordionItem");
  }

  return (
    <StyledTouchableOpacity
      onPress={__accordionOnPress}
      className={cn(
        "flex flex-1 flex-row items-center justify-between py-4 font-medium transition-all",
        __accordionItemIsOpen ? "[&>svg]:rotate-180" : "", // Apply rotation based on state
        className
      )}
      {...props}
    >
      <StyledText className="text-base font-medium">{children}</StyledText>
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200",
          __accordionItemIsOpen ? "rotate-180" : "" // Explicitly apply rotate class
        )}
      />
    </StyledTouchableOpacity>
  );
});
AccordionTrigger.displayName = "AccordionTrigger";

// AccordionContent
interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
  // Internal props passed from AccordionItem
  __accordionItemValue?: string;
  __accordionItemIsOpen?: boolean;
}

const AccordionContent = styled(({
  className,
  children,
  __accordionItemValue,
  __accordionItemIsOpen,
  ...props
}: AccordionContentProps) => {
  if (__accordionItemValue === undefined) {
    throw new Error("AccordionContent must be used within an AccordionItem");
  }

  // Simple conditional rendering for content visibility
  if (!__accordionItemIsOpen) {
    return null;
  }

  return (
    <StyledView
      className={cn("overflow-hidden text-sm", className)}
      data-state={__accordionItemIsOpen ? "open" : "closed"}
      {...props}
    >
      <StyledView className={cn("pb-4 pt-0", className)}>
        {children}
      </StyledView>
    </StyledView>
  );
});
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
