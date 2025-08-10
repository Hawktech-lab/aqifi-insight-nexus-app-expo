import * as React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
  showOutsideDays?: boolean;
  disabled?: boolean;
}

function Calendar({
  className,
  selected,
  onSelect,
  showOutsideDays = true,
  disabled = false,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!selected) return false;
    return day === selected.getDate() && 
           currentMonth.getMonth() === selected.getMonth() && 
           currentMonth.getFullYear() === selected.getFullYear();
  };

  const handleDayPress = (day: number) => {
    if (disabled) return;
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onSelect?.(selectedDate);
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <View key={`empty-${i}`} className="h-9 w-9" />
      );
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isCurrentDay = isToday(day);
      const isSelectedDay = isSelected(day);
      
      days.push(
        <TouchableOpacity
          key={day}
          className={cn(
            "h-9 w-9 items-center justify-center rounded-md",
            isSelectedDay ? "bg-primary" : "hover:bg-accent",
            isCurrentDay && !isSelectedDay ? "bg-accent" : "",
            disabled ? "opacity-50" : ""
          )}
          onPress={() => handleDayPress(day)}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text className={cn(
            "text-sm",
            isSelectedDay ? "text-primary-foreground font-medium" : "text-foreground",
            isCurrentDay && !isSelectedDay ? "text-accent-foreground" : ""
          )}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View className={cn("p-3", className)} {...props}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity
          onPress={goToPreviousMonth}
          disabled={disabled}
          activeOpacity={0.7}
          className="h-7 w-7 items-center justify-center rounded-md border bg-transparent"
        >
          <ChevronLeft size={16} color="#6b7280" />
        </TouchableOpacity>
        
        <Text className="text-sm font-medium">
          {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        
        <TouchableOpacity
          onPress={goToNextMonth}
          disabled={disabled}
          activeOpacity={0.7}
          className="h-7 w-7 items-center justify-center rounded-md border bg-transparent"
        >
          <ChevronRight size={16} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Week days */}
      <View className="flex-row mb-2">
        {weekDays.map((day) => (
          <View key={day} className="h-9 w-9 items-center justify-center">
            <Text className="text-xs text-muted-foreground font-medium">{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View className="flex-row flex-wrap">
        {renderCalendarDays()}
      </View>
    </View>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
