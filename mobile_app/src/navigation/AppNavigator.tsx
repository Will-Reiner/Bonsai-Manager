import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import LoginScreen from '../screens/Auth/LoginScreen';
import CollectionScreen from '../screens/App/CollectionScreen';
import PlantDetailScreen from '../screens/App/PlantDetailScreen';
import AddPlantScreen from '../screens/App/AddPlantScreen';
import EditPlantScreen from '../screens/App/EditPlantScreen';
import AdminScreen from '../screens/App/AdminScreen';
import { useAuth } from '../context/AuthContext';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  PlantDetail: { plantaId: string };
  AddPlant: undefined;
  EditPlant: { plantaId: string };
  Admin: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { authState } = useAuth();

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
          <>
            <Stack.Screen name="Home" component={CollectionScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PlantDetail" component={PlantDetailScreen} options={{ title: 'Detalhes da Planta' }} />
            <Stack.Screen name="AddPlant" component={AddPlantScreen} options={{ title: 'Adicionar Nova Planta' }} />
            <Stack.Screen name="EditPlant" component={EditPlantScreen} options={{ title: 'Editar Planta' }} />
            <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Painel Admin' }} /> 
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;