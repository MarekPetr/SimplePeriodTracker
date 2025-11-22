import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { calendarApi } from '@/api/calendar';
import { DayInfo } from '@/types/cycle';
import { DayDetailModal } from '@/components/DayDetailModal';
import { CalendarDay } from '@/components/CalendarDay';

export const CalendarView: React.FC = () => {
  const [monthData, setMonthData] = useState<Record<string, DayInfo>>({});
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  useEffect(() => {
    loadMonthData(currentMonth.year, currentMonth.month);
  }, [currentMonth]);

  const loadMonthData = async (year: number, month: number) => {
    try {
      setIsLoading(true);
      const data = await calendarApi.getMonthData(year, month);

      // Convert array to object keyed by date for easier lookup
      const dataMap: Record<string, DayInfo> = {};
      data.forEach((dayInfo) => {
        dataMap[dayInfo.date] = dayInfo;
      });

      setMonthData(dataMap);
    } catch (error) {
      console.error('Error loading month data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonthChange = (date: DateData) => {
    setCurrentMonth({ year: date.year, month: date.month });
  };

  const handleDayPress = (date: DateData) => {
    setSelectedDate(date.dateString);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleNoteUpdated = () => {
    // Reload month data to update hasNote indicators
    loadMonthData(currentMonth.year, currentMonth.month);
  };

  // Build marked dates object for react-native-calendars
  const markedDates = Object.keys(monthData).reduce((acc, dateString) => {
    const dayInfo = monthData[dateString];
    let color = '';

    if (dayInfo.type === 'period') {
      color = '#ef4444'; // Red
    } else if (dayInfo.type === 'ovulation') {
      color = '#22c55e'; // Green
    } else if (dayInfo.type === 'fertile') {
      color = '#86efac'; // Light green
    }

    acc[dateString] = {
      selected: dateString === selectedDate,
      selectedColor: '#ec4899', // Pink for selected
      marked: dayInfo.hasNote || false,
      dotColor: '#d4a574', // Beige for note indicator
      ...(color && { customStyles: {
        container: {
          backgroundColor: color,
          borderRadius: 16,
        },
        text: {
          color: 'white',
          fontWeight: 'bold',
        },
      }}),
    };

    return acc;
  }, {} as any);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#ec4899" />
      </View>
    );
  }

  return (
    <>
      <Calendar
        current={`${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}-01`}
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        dayComponent={({ date, state }) => (
          <CalendarDay
            date={date}
            state={state}
            dayInfo={date ? monthData[date.dateString] : undefined}
            onPress={() => date && handleDayPress(date)}
          />
        )}
        theme={{
          arrowColor: '#ec4899',
          monthTextColor: '#1f2937',
          textMonthFontWeight: 'bold',
          textMonthFontSize: 18,
        }}
      />

      {/* Legend */}
      <View className="px-6 py-4 border-t border-gray-200 mt-4">
        <Text className="text-sm font-semibold text-gray-700 mb-3">Legend:</Text>
        <View className="flex-row flex-wrap gap-4">
          <View className="flex-row items-center">
            <View className="w-4 h-4 bg-red-500 rounded mr-2" />
            <Text className="text-sm text-gray-600">Period</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-4 h-4 bg-green-500 rounded mr-2" />
            <Text className="text-sm text-gray-600">Ovulation</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-4 h-4 bg-green-300 rounded mr-2" />
            <Text className="text-sm text-gray-600">Fertile</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-amber-700 rounded-full mr-2" />
            <Text className="text-sm text-gray-600">Has Note</Text>
          </View>
        </View>
      </View>

      <DayDetailModal
        visible={isModalVisible}
        date={selectedDate}
        dayInfo={monthData[selectedDate]}
        onClose={handleCloseModal}
        onNoteUpdated={handleNoteUpdated}
      />
    </>
  );
};
