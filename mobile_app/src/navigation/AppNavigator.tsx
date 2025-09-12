import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';

// Importar todas as telas
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import CollectionScreen from '../screens/App/CollectionScreen';
import PlantDetailScreen from '../screens/App/PlantDetailScreen';
import AddPlantScreen from '../screens/App/AddPlantScreen';
import EditPlantScreen from '../screens/App/EditPlantScreen';
import AdminScreen from '../screens/App/AdminScreen';
import AgendaScreen from '../screens/App/AgendaScreen';
import ScheduleCareScreen from '../screens/App/ScheduleCareScreen';
import InventoryScreen from '../screens/App/InventoryScreen';
import EncyclopediaScreen from '../screens/App/EncyclopediaScreen';
import SpeciesListScreen from '../screens/App/SpeciesListScreen';
import SpeciesDetailScreen from '../screens/App/SpeciesDetailScreen';
import TechniquesListScreen from '../screens/App/TechniquesListScreen';
import TechniqueDetailScreen from '../screens/App/TechniqueDetailScreen';
import ProfileScreen from '../screens/App/ProfileScreen';

import { useAuth } from '../context/AuthContext';

// Tipagem para o Stack Navigator (telas que empilham)
export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  Register: undefined;
  PlantDetail: { plantaId: string };
  AddPlant: undefined;
  EditPlant: { plantaId: string };
  Admin: undefined;
  ScheduleCare: { plantaId: string };
  SpeciesList: undefined;
  SpeciesDetail: { especieId: string };
  TechniquesList: undefined;
  TechniqueDetail: { atividadeId: string; title: string };
};

// Tipagem para o Tab Navigator (abas principais)
export type MainTabParamList = {
  Collection: undefined;
  Agenda: undefined;
  Inventory: undefined;
  Encyclopedia: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Componente que renderiza a navegação por abas
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen name="Collection" component={CollectionScreen} options={{ title: 'Coleção' }} />
      <Tab.Screen name="Agenda" component={AgendaScreen} options={{ title: 'Agenda' }} />
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{ title: 'Inventário' }} />
      <Tab.Screen name="Encyclopedia" component={EncyclopediaScreen} options={{ title: 'Enciclopédia' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
};

// Componente principal do navegador do aplicativo
const AppNavigator = () => {
  const { authState } = useAuth();

  // Mostra um indicador de carregamento enquanto verifica o estado de autenticação
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
          // Telas disponíveis para usuários autenticados
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="PlantDetail" component={PlantDetailScreen} options={{ title: 'Detalhes da Planta' }} />
            <Stack.Screen name="AddPlant" component={AddPlantScreen} options={{ title: 'Adicionar Nova Planta' }} />
            <Stack.Screen name="EditPlant" component={EditPlantScreen} options={{ title: 'Editar Planta' }} />
            <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Painel Admin' }} />
            <Stack.Screen name="ScheduleCare" component={ScheduleCareScreen} options={{ title: 'Agendar Cuidado' }} />
            <Stack.Screen name="SpeciesList" component={SpeciesListScreen} options={{ title: 'Guia de Espécies' }} />
            <Stack.Screen name="SpeciesDetail" component={SpeciesDetailScreen} options={{ title: 'Detalhes da Espécie' }} />
            <Stack.Screen name="TechniquesList" component={TechniquesListScreen} options={{ title: 'Guia de Técnicas' }} />
            <Stack.Screen name="TechniqueDetail" component={TechniqueDetailScreen} options={({ route }) => ({ title: route.params.title })} />
          </>
        ) : (
          // Telas disponíveis para usuários não autenticados
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;