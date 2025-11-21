import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/provider';

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
    <View className="flex-1 bg-white justify-center items-center px-6">
      <Text className="text-3xl font-bold text-pink-600 mb-4">
        {t('app.name')}
      </Text>
      <Text className="text-lg text-gray-700 mb-2">
        Welcome, {user?.email}!
      </Text>
      <Text className="text-base text-gray-600 mb-8">
        Gender: {user?.gender === 'woman' ? t('auth.woman') : t('auth.man')}
      </Text>

      <Text className="text-gray-500 text-center mb-8">
        Calendar view coming soon...
      </Text>

      <TouchableOpacity
        className="bg-red-500 rounded-lg py-3 px-8"
        onPress={handleLogout}
      >
        <Text className="text-white font-semibold">{t('auth.logout')}</Text>
      </TouchableOpacity>
    </View>
  );
};
