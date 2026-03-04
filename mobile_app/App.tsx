import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { PreferenciasProvider } from './src/context/PreferenciasContext';

export default function App() {
  return (
    <AuthProvider>
      <PreferenciasProvider>
        <AppNavigator />
      </PreferenciasProvider>
    </AuthProvider>
  );
}
