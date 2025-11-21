import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/provider';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = t('auth.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.emailInvalid');
    }

    if (!password) {
      newErrors.password = t('auth.passwordRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert(
        t('common.error'),
        error.response?.data?.detail || t('auth.loginError')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-12">
          <Text className="text-4xl font-bold text-center text-pink-600 mb-2">
            {t('app.name')}
          </Text>
          <Text className="text-lg text-center text-gray-600">
            {t('auth.login')}
          </Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {t('auth.email')}
            </Text>
            <TextInput
              className={`border rounded-lg px-4 py-3 text-base ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('auth.email')}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
            />
            {errors.email && (
              <Text className="text-red-500 text-sm mt-1">{errors.email}</Text>
            )}
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {t('auth.password')}
            </Text>
            <TextInput
              className={`border rounded-lg px-4 py-3 text-base ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('auth.password')}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              editable={!isLoading}
            />
            {errors.password && (
              <Text className="text-red-500 text-sm mt-1">{errors.password}</Text>
            )}
          </View>

          <TouchableOpacity
            className={`bg-pink-600 rounded-lg py-4 mt-4 ${
              isLoading ? 'opacity-50' : ''
            }`}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-lg">
                {t('auth.login')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="mt-8 flex-row justify-center">
          <Text className="text-gray-600">{t('auth.noAccount')} </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            disabled={isLoading}
          >
            <Text className="text-pink-600 font-semibold">
              {t('auth.register')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
