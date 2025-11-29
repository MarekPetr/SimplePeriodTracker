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
import { CalendarColors } from '@/constants/colors';

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
          period_start_date: dateString,
          period_end_date: dateString,
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
          period_start_date: periodStartDate,
          period_end_date: dateString,
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
        const startDateStr = p.period_start_date.split('T')[0];
        const endDateStr = p.period_end_date ? p.period_end_date.split('T')[0] : startDateStr;

        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        return clickedDate >= startDate && clickedDate <= endDate;
      });

      if (!period) {
        // No period found for this date
        return;
      }

      // Extract just the date part from datetime strings
      const startDateStr = period.period_start_date.split('T')[0];
      const endDateStr = period.period_end_date
        ? period.period_end_date.split('T')[0]
        : startDateStr;

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
          period_start_date: newStartDateStr,
          period_end_date: endDateStr,
        });
      } else if (isLastDay) {
        const newEndDate = new Date(endDate);
        newEndDate.setDate(newEndDate.getDate() - 1);
        const newEndDateStr = newEndDate.toISOString().split('T')[0];

        await cyclesApi.updateCycle(period.id, {
          period_start_date: startDateStr,
          period_end_date: newEndDateStr,
        });
      } else {
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
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#a91524" />
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
          arrowColor: '#a91524',
          monthTextColor: '#1f2937',
          textMonthFontWeight: 'bold',
          textMonthFontSize: 18,
        }}
      />

      {/* Legend */}
      <View className="mt-2 px-6 py-4">
        <View className="flex-row flex-wrap justify-center gap-4">
          <View className="flex-row items-center">
            <View className={`mr-2 h-4 w-4 rounded ${CalendarColors.period}`} />
            <Text className="text-sm text-gray-600">{t('calendar.period')}</Text>
          </View>
          <View className="flex-row items-center">
            <View className={`mr-2 h-4 w-4 rounded ${CalendarColors.ovulation}`} />
            <Text className="text-sm text-gray-600">{t('calendar.ovulation')}</Text>
          </View>
          <View className="flex-row items-center">
            <View className={`mr-2 h-4 w-4 rounded ${CalendarColors.fertile}`} />
            <Text className="text-sm text-gray-600">{t('calendar.fertile')}</Text>
          </View>
          <View className="flex-row items-center">
            <View className={`mr-2 h-3 w-3 rounded-full ${CalendarColors.note}`} />
            <Text className="text-sm text-gray-600">{t('calendar.hasNote')}</Text>
          </View>
        </View>
      </View>

      {/* Log Period and Edit Period Buttons */}
      <View className="px-6 py-4">
        <View className="">
          <Text className="mb-2 border-b border-gray-200 text-xl font-bold text-red-600">
            {t('calendar.period')}
          </Text>
        </View>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handleTogglePeriodLogging}
            className={`flex-1 rounded-lg px-6 py-3 ${
              editMode === 'add-period' ? 'bg-red-600' : 'bg-red-500'
            }`}
            activeOpacity={0.8}>
            <Text className="text-center text-base font-semibold text-white">
              {editMode === 'add-period' ? t('common.cancel') : t('calendar.addPeriod')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleTogglePeriodEditing}
            className={`flex-1 rounded-lg px-6 py-3 ${
              editMode === 'edit-period' ? 'bg-orange-400' : 'bg-orange-400'
            }`}
            activeOpacity={0.8}>
            <Text className="text-center text-base font-semibold text-white">
              {editMode === 'edit-period' ? t('common.cancel') : t('calendar.removePeriod')}
            </Text>
          </TouchableOpacity>
        </View>

        {editMode === 'add-period' && (
          <View className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <Text className="text-blood-800 text-center text-sm">
              {periodStartDate
                ? `${t('hints.startDateSelected')}: ${periodStartDate}\n${t('hints.tapEndDate')}`
                : t('hints.tapOneDay')}
            </Text>
          </View>
        )}

        {editMode === 'edit-period' && (
          <View className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
            <Text className="text-center text-sm text-orange-800">
              {t('hints.edit.tapPeriodDay')}
              {'\n'}
              {t('hints.edit.firstDay')}
              {'\n'}
              {t('hints.edit.middleDay')}
              {'\n'}
              {t('hints.edit.lastDay')}
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
