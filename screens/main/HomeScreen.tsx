import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/provider';
import { CalendarView } from '@/components/CalendarView';

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useI18n();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-12 pb-4 px-6 bg-pink-600">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-white">{t('app.name')}</Text>
            <Text className="text-white text-sm mt-1">{user?.email}</Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-white/20 rounded-lg px-4 py-2"
          >
            <Text className="text-white font-semibold">{t('auth.logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView>
        <CalendarView />
      </ScrollView>
    </View>
  );
};
