import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { DayInfo } from '@/types/cycle';

interface CalendarDayProps {
  date?: { dateString: string; day: number; month: number; year: number };
  state?: string;
  marking?: any;
  dayInfo?: DayInfo;
  onPress?: () => void;
}

export const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  state,
  dayInfo,
  onPress,
}) => {
  if (!date) {
    return <View className="w-10 h-10" />;
  }

  const isDisabled = state === 'disabled';
  const isToday = state === 'today';

  // Determine background color based on day type
  let bgColor = 'bg-transparent';
  let textColor = 'text-gray-900';

  if (dayInfo?.type === 'period') {
    bgColor = 'bg-red-500';
    textColor = 'text-white';
  } else if (dayInfo?.type === 'ovulation') {
    bgColor = 'bg-green-500';
    textColor = 'text-white';
  } else if (dayInfo?.type === 'fertile') {
    bgColor = 'bg-green-300';
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
      className="w-10 h-10 items-center justify-center"
    >
      <View
        className={`w-9 h-9 rounded-full items-center justify-center ${bgColor} ${
          isToday && bgColor === 'bg-transparent' ? 'border-2 border-pink-500' : ''
        }`}
      >
        <Text className={`font-semibold ${textColor}`}>{date.day}</Text>
        {dayInfo?.hasNote && (
          <View className="absolute bottom-0.5">
            <View className="w-1.5 h-1.5 rounded-full bg-amber-700" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
