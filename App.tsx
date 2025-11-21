import { StatusBar } from 'expo-status-bar';
import { I18nProvider } from './i18n/provider';
import { AuthProvider } from './context/AuthContext';
import { AppNavigator } from './navigation/AppNavigator';

import './global.css';

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </I18nProvider>
  );
}
