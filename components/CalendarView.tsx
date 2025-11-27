import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { calendarApi } from '@/api/calendar';
import { cyclesApi } from '@/api/cycles';
import { DayInfo } from '@/types/cycle';
import { DayDetailModal } from '@/components/DayDetailModal';
import { CalendarDay } from '@/components/CalendarDay';

type LoggingMode = 'period' | null;

export const CalendarView: React.FC = () => {
  const [monthData, setMonthData] = useState<Record<string, DayInfo>>({});
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [loggingMode, setLoggingMode] = useState<LoggingMode>(null);
  const [periodStartDate, setPeriodStartDate] = useState<string | null>(null);

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
    // If in logging mode, handle period logging
    if (loggingMode === 'period') {
      handlePeriodLogging(date.dateString);
      return;
    }

    // Normal mode: open note modal
    setSelectedDate(date.dateString);
    setIsModalVisible(true);
  };

  const handlePeriodLogging = async (dateString: string) => {
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    // Only allow today or past dates
    if (selectedDate > today) {
      return;
    }

    // If clicking today, create/extend period immediately
    if (selectedDate.getTime() === today.getTime()) {
      try {
        await cyclesApi.createCycle({
          start_date: dateString,
          end_date: dateString,
        });
        setLoggingMode(null);
        loadMonthData(currentMonth.year, currentMonth.month);
      } catch (error) {
        console.error('Error logging period:', error);
      }
      return;
    }

    // For past dates: two-step process (start then end)
    if (!periodStartDate) {
      // First click: set start date (shown with lighter red)
      setPeriodStartDate(dateString);
    } else {
      // Second click: set end date and create period
      const startDate = new Date(periodStartDate);
      startDate.setHours(0, 0, 0, 0);

      if (selectedDate < startDate) {
        return;
      }

      try {
        await cyclesApi.createCycle({
          start_date: periodStartDate,
          end_date: dateString,
        });
        setPeriodStartDate(null);
        setLoggingMode(null);
        loadMonthData(currentMonth.year, currentMonth.month);
      } catch (error) {
        console.error('Error logging period:', error);
      }
    }
  };

  const handleTogglePeriodLogging = () => {
    if (loggingMode === 'period') {
      // Cancel logging mode
      setLoggingMode(null);
      setPeriodStartDate(null);
    } else {
      // Enter period logging mode
      setLoggingMode('period');
      setPeriodStartDate(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleNoteUpdated = () => {
    // Reload month data to update hasNote indicators
    loadMonthData(currentMonth.year, currentMonth.month);
  };

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
            isLoggingPeriodStart={loggingMode === 'period' && date?.dateString === periodStartDate}
          />
        )}
        theme={{
          arrowColor: '#ec4899',
          monthTextColor: '#1f2937',
          textMonthFontWeight: 'bold',
          textMonthFontSize: 18,
        }}
      />

      {/* Log Period Button */}
      <View className="px-6 py-4 border-t border-gray-200">
        <TouchableOpacity
          onPress={handleTogglePeriodLogging}
          className={`py-3 px-6 rounded-lg ${
            loggingMode === 'period' ? 'bg-red-600' : 'bg-red-500'
          }`}
          activeOpacity={0.8}
        >
          <Text className="text-white text-center font-semibold text-base">
            {loggingMode === 'period'
              ? periodStartDate
                ? `Cancel (Start: ${periodStartDate})`
                : 'Cancel Period Logging'
              : 'Log Period'}
          </Text>
        </TouchableOpacity>

        {loggingMode === 'period' && (
          <View className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <Text className="text-red-800 text-sm text-center">
              {periodStartDate
                ? `Start date selected: ${periodStartDate}\n\nTap the end date on the calendar`
                : 'Tap today to mark it, or tap a past date to select start date'}
            </Text>
          </View>
        )}
      </View>

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
