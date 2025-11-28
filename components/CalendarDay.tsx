import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { DayInfo } from '@/types/cycle';
import { CalendarColors } from '@/constants/colors';

interface CalendarDayProps {
  date?: { dateString: string; day: number; month: number; year: number };
  state?: string;
  marking?: any;
  dayInfo?: DayInfo;
  onPress?: () => void;
  isLoggingPeriodStart?: boolean;
}

export const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  state,
  dayInfo,
  onPress,
  isLoggingPeriodStart,
}) => {
  if (!date) {
    return <View className="h-10 w-10" />;
  }

  const isDisabled = state === 'disabled';
  const isToday = state === 'today';

  // Determine background color based on day type
  let bgColor = 'bg-transparent';
  let textColor = 'text-gray-900';

  // Show lighter red for period start selection
  if (isLoggingPeriodStart) {
    bgColor = CalendarColors.periodSelecting;
    textColor = 'text-gray-900';
  } else if (dayInfo?.type === 'period') {
    bgColor = CalendarColors.period;
    textColor = 'text-white';
  } else if (dayInfo?.type === 'ovulation') {
    bgColor = CalendarColors.ovulation;
    textColor = 'text-white';
  } else if (dayInfo?.type === 'fertile') {
    bgColor = CalendarColors.fertile;
    textColor = 'text-gray-900';
  }

  if (isDisabled) {
    textColor = 'text-gray-300';
    bgColor = 'bg-transparent';
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className="items-center justify-center">
      <View
        className={`h-10 w-10 items-center justify-center rounded-full ${bgColor} ${
          isToday && bgColor === 'bg-transparent' ? `border-2 ${CalendarColors.today}` : ''
        }`}>
        <Text className={`font-semibold ${textColor}`}>{date.day}</Text>
        {dayInfo?.hasNote && (
          <View className="absolute bottom-0.5">
            <View className={`h-1.5 w-1.5 rounded-full ${CalendarColors.note}`} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
