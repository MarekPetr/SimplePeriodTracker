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
import { useI18n } from '@/i18n/provider';

interface RegisterScreenProps {
  navigation: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { register } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState<'woman' | 'man' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    gender?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
      gender?: string;
    } = {};

    if (!email) {
      newErrors.email = t('auth.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.emailInvalid');
    }

    if (!password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (password.length < 8) {
      newErrors.password = t('auth.passwordTooShort');
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordRequired');
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordsDontMatch');
    }

    if (!gender) {
      newErrors.gender = t('auth.genderRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm() || !gender) return;

    setIsLoading(true);
    try {
      await register(email, password, gender);
    } catch (error: any) {
      Alert.alert(
        t('common.error'),
        error.response?.data?.detail || t('auth.registerError')
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
        contentContainerClassName="flex-grow justify-center px-6 py-8"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-8">
          <Text className="text-4xl font-bold text-center text-red-600 mb-2">
            {t('app.name')}
          </Text>
          <Text className="text-lg text-center text-gray-600">
            {t('auth.register')}
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
              autoComplete="password-new"
              editable={!isLoading}
            />
            {errors.password && (
              <Text className="text-red-500 text-sm mt-1">{errors.password}</Text>
            )}
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {t('auth.confirmPassword')}
            </Text>
            <TextInput
              className={`border rounded-lg px-4 py-3 text-base ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('auth.confirmPassword')}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword)
                  setErrors({ ...errors, confirmPassword: undefined });
              }}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
            {errors.confirmPassword && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.confirmPassword}
              </Text>
            )}
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {t('auth.gender')}
            </Text>
            <View className="flex-row space-x-4">
              <TouchableOpacity
                className={`flex-1 border-2 rounded-lg py-4 ${
                  gender === 'woman'
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-300'
                }`}
                onPress={() => {
                  setGender('woman');
                  if (errors.gender) setErrors({ ...errors, gender: undefined });
                }}
                disabled={isLoading}
              >
                <Text
                  className={`text-center font-semibold ${
                    gender === 'woman' ? 'text-red-600' : 'text-gray-600'
                  }`}
                >
                  {t('auth.woman')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 border-2 rounded-lg py-4 ${
                  gender === 'man'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300'
                }`}
                onPress={() => {
                  setGender('man');
                  if (errors.gender) setErrors({ ...errors, gender: undefined });
                }}
                disabled={isLoading}
              >
                <Text
                  className={`text-center font-semibold ${
                    gender === 'man' ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  {t('auth.man')}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.gender && (
              <Text className="text-red-500 text-sm mt-1">{errors.gender}</Text>
            )}
          </View>

          <TouchableOpacity
            className={`bg-red-600 rounded-lg py-4 mt-4 ${
              isLoading ? 'opacity-50' : ''
            }`}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-lg">
                {t('auth.register')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="mt-6 flex-row justify-center">
          <Text className="text-gray-600">{t('auth.haveAccount')} </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            disabled={isLoading}
          >
            <Text className="text-red-600 font-semibold">{t('auth.login')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
