import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { calendarApi } from '@/api/calendar';
import { cyclesApi } from '@/api/cycles';
import { DayInfo } from '@/types/cycle';
import { DayDetailModal } from '@/components/DayDetailModal';
import { CalendarDay } from '@/components/CalendarDay';
import { useI18n } from '@/i18n/provider';
import '@/config/calendarLocale';

type LoggingMode = 'add-period' | 'edit-period' | null;

export const CalendarView: React.FC = () => {
  const [monthData, setMonthData] = useState<Record<string, DayInfo>>({});
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [editMode, setLoggingMode] = useState<LoggingMode>(null);
  const [periodStartDate, setPeriodStartDate] = useState<string | null>(null);
  const { t } = useI18n();

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
    if (editMode === 'add-period') {
      handlePeriodLogging(date.dateString);
      return;
    }

    if (editMode === 'edit-period') {
      handlePeriodEditing(date.dateString);
      return;
    }

    setSelectedDate(date.dateString);
    setIsModalVisible(true);
  };

  const handlePeriodLogging = async (dateString: string) => {
    const selectedDate = new Date(dateString).getDate();
    const today = new Date().getDate();

    // Only allow today or past dates
    if (selectedDate > today) {
      return;
    }

    // If clicking today, create/extend period immediately
    if (selectedDate === today) {
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
      const startDate = new Date(periodStartDate).getDate();
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

  const handlePeriodEditing = async (dateString: string) => {
    const clickedDate = new Date(dateString);

    try {
      // Fetch all periods to find which one contains this date
      const periods = await cyclesApi.getCycles();
      // Find the period that contains this date
      const period = periods.find((p) => {
        // Extract just the date part (YYYY-MM-DD) from datetime strings
        const startDateStr = p.start_date.split('T')[0];
        const endDateStr = p.end_date ? p.end_date.split('T')[0] : startDateStr;

        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        return clickedDate >= startDate && clickedDate <= endDate;
      });

      if (!period) {
        // No period found for this date
        console.log('No period found for this date');
        return;
      }

      // Extract just the date part from datetime strings
      const startDateStr = period.start_date.split('T')[0];
      const endDateStr = period.end_date ? period.end_date.split('T')[0] : startDateStr;

      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);

      const isFirstDay = clickedDate.getDate() === startDate.getDate();
      const isLastDay = clickedDate.getDate() === endDate.getDate();
      const isSingleDay = startDate.getDate() === endDate.getDate();

      if (isSingleDay) {
        await cyclesApi.deleteCycle(period.id);
      } else if (isFirstDay) {
        const newStartDate = new Date(startDate);
        newStartDate.setDate(newStartDate.getDate() + 1);
        const newStartDateStr = newStartDate.toISOString().split('T')[0];
        await cyclesApi.updateCycle(period.id, {
          start_date: newStartDateStr,
          end_date: endDateStr,
        });
      } else if (isLastDay) {
        const newEndDate = new Date(endDate);
        newEndDate.setDate(newEndDate.getDate() - 1);
        const newEndDateStr = newEndDate.toISOString().split('T')[0];

        await cyclesApi.updateCycle(period.id, {
          start_date: startDateStr,
          end_date: newEndDateStr,
        });
      } else {
        console.log('Deleting entire period (middle day clicked)');
        await cyclesApi.deleteCycle(period.id);
      }

      // Reload calendar data
      loadMonthData(currentMonth.year, currentMonth.month);
    } catch (error) {
      console.error('Error editing period:', error);
    }
  };

  const handleTogglePeriodLogging = () => {
    if (editMode === 'add-period') {
      // Cancel logging mode
      setLoggingMode(null);
      setPeriodStartDate(null);
    } else {
      // Enter period logging mode
      setLoggingMode('add-period');
      setPeriodStartDate(null);
    }
  };

  const handleTogglePeriodEditing = () => {
    if (editMode === 'edit-period') {
      // Cancel edit mode
      setLoggingMode(null);
    } else {
      // Enter edit mode
      setLoggingMode('edit-period');
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
            isLoggingPeriodStart={editMode === 'add-period' && date?.dateString === periodStartDate}
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
      <View className="px-6 py-4 mt-2">
        <View className="flex-row flex-wrap gap-4 justify-center">
          <View className="flex-row items-center">
            <View className="w-4 h-4 bg-red-500 rounded mr-2" />
            <Text className="text-sm text-gray-600">{ t('calendar.period') }</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-4 h-4 bg-green-500 rounded mr-2" />
            <Text className="text-sm text-gray-600">{ t('calendar.ovulation') }</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-4 h-4 bg-green-300 rounded mr-2" />
            <Text className="text-sm text-gray-600">{ t('calendar.fertile') }</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-amber-700 rounded-full mr-2" />
            <Text className="text-sm text-gray-600">{ t('calendar.hasNote') }</Text>
          </View>
        </View>
      </View>

      {/* Log Period and Edit Period Buttons */}
      <View className="px-6 py-4">
        <View className="">
          <Text className="text-xl font-bold border-b mb-2 border-gray-200 text-red-600">
            { t('calendar.period') }
          </Text>
        </View>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handleTogglePeriodLogging}
            className={`flex-1 py-3 px-6 rounded-lg ${
              editMode === 'add-period' ? 'bg-red-600' : 'bg-red-500'
            }`}
            activeOpacity={0.8}
          >
            <Text className="text-white text-center font-semibold text-base">
              {editMode === 'add-period' ? 'Cancel' : t('calendar.addPeriod')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleTogglePeriodEditing}
            className={`flex-1 py-3 px-6 rounded-lg ${
              editMode === 'edit-period' ? 'bg-orange-600' : 'bg-orange-500'
            }`}
            activeOpacity={0.8}
          >
            <Text className="text-white text-center font-semibold text-base">
              {editMode === 'edit-period' ? 'Cancel' : t('calendar.removePeriod')}
            </Text>
          </TouchableOpacity>
        </View>

        {editMode === 'add-period' && (
          <View className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <Text className="text-blood-800 text-sm text-center">
              {periodStartDate
                ? `Start date selected: ${periodStartDate}\n\nTap the end date on the calendar`
                : 'Tap today to mark it, or tap a past date to select start date'}
            </Text>
          </View>
        )}

        {editMode === 'edit-period' && (
          <View className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <Text className="text-orange-800 text-sm text-center">
              Tap a period day to edit:{'\n'}
              First day - removes first day{'\n'}
              Middle day - removes entire period{'\n'}
              Last day - removes last day
            </Text>
          </View>
        )}
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
