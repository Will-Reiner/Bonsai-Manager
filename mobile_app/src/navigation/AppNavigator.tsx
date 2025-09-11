import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';

import LoginScreen from '../screens/Auth/LoginScreen';
import CollectionScreen from '../screens/App/CollectionScreen';
import PlantDetailScreen from '../screens/App/PlantDetailScreen';
import AddPlantScreen from '../screens/App/AddPlantScreen';
import { useAuth } from '../context/AuthContext';

// Define os tipos para todas as rotas e os parâmetros que elas esperam.
// 'undefined' significa que a rota não espera parâmetros.
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  PlantDetail: { plantaId: string };
  AddPlant: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { authState } = useAuth();

  // Mostra um indicador de carregamento enquanto o token está a ser verificado
  if (authState.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {authState.isAuthenticated ? (
          // Rotas disponíveis quando o utilizador está autenticado
          <>
            <Stack.Screen 
              name="Home" 
              component={CollectionScreen} 
              options={{ 
                // Vamos remover o header padrão aqui para usar o nosso personalizado
                headerShown: false 
              }} 
            />
            <Stack.Screen 
              name="PlantDetail" 
              component={PlantDetailScreen} 
              options={{ title: 'Detalhes da Planta' }} 
            />
            <Stack.Screen 
              name="AddPlant" 
              component={AddPlantScreen} 
              options={{ title: 'Adicionar Nova Planta' }} 
            />
          </>
        ) : (
          // Rota disponível quando o utilizador não está autenticado
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }} 
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;