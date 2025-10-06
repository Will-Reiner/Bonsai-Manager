import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Importando os ícones
import { theme } from '../constants/theme'; // Importando nosso tema

// Import all screens
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
import CommunityScreen from '../screens/App/CommunityScreen';
import PublicProfileScreen from '../screens/App/PublicProfileScreen';
import UserListScreen from '../screens/App/UserListScreen';

import { useAuth } from '../context/AuthContext';
import { Usuario } from '../types';

// Tipos para o navegador principal (Stack)
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
  SpeciesDetail: { especieId: string; title: string };
  TechniquesList: undefined;
  TechniqueDetail: { atividadeId: string; title: string };
  PublicProfile: { userId: string };
  UserList: { users: Partial<Usuario>[]; title: string };
  Home: undefined; // Adicionado para evitar erro de tipo em CollectionScreen
};

// Tipos para a navegação por abas (Tabs)
export type MainTabParamList = {
  Collection: undefined;
  Agenda: undefined;
  Inventory: undefined;
  Encyclopedia: undefined;
  Community: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Componente para a Navegação por Abas com os novos ícones e cores
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.subtext,
        tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' },
        tabBarStyle: {
            backgroundColor: theme.colors.card,
            borderTopColor: theme.colors.lightGray,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'];

          if (route.name === 'Collection') {
            iconName = 'leaf';
          } else if (route.name === 'Agenda') {
            iconName = 'calendar-check';
          } else if (route.name === 'Inventory') {
            iconName = 'archive-outline';
          } else if (route.name === 'Encyclopedia') {
            iconName = 'book-open-variant';
          } else if (route.name === 'Community') {
            iconName = 'account-group-outline';
          } else if (route.name === 'Profile') {
            iconName = 'account-circle-outline';
          } else {
            iconName = 'help-circle'; // Ícone padrão
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Collection" component={CollectionScreen} options={{ title: 'Coleção' }} />
      <Tab.Screen name="Agenda" component={AgendaScreen} options={{ title: 'Agenda' }} />
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{ title: 'Inventário' }} />
      <Tab.Screen name="Encyclopedia" component={EncyclopediaScreen} options={{ title: 'Enciclopédia' }} />
      <Tab.Screen name="Community" component={CommunityScreen} options={{ title: 'Comunidade' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { authState } = useAuth();

  if (authState.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {authState.isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="PlantDetail" component={PlantDetailScreen} options={{ title: 'Detalhes da Planta' }} />
            <Stack.Screen name="AddPlant" component={AddPlantScreen} options={{ title: 'Adicionar Nova Planta' }} />
            <Stack.Screen name="EditPlant" component={EditPlantScreen} options={{ title: 'Editar Planta' }} />
            <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Painel Admin' }} />
            <Stack.Screen name="ScheduleCare" component={ScheduleCareScreen} options={{ title: 'Agendar Cuidado' }} />
            <Stack.Screen name="SpeciesList" component={SpeciesListScreen} options={{ title: 'Guia de Espécies' }} />
            <Stack.Screen name="SpeciesDetail" component={SpeciesDetailScreen} options={({ route }) => ({ title: route.params.title })} />
            <Stack.Screen name="TechniquesList" component={TechniquesListScreen} options={{ title: 'Guia de Técnicas' }} />
            <Stack.Screen name="TechniqueDetail" component={TechniqueDetailScreen} options={({ route }) => ({ title: route.params.title })} />
            <Stack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ title: 'Perfil Público' }} />
            <Stack.Screen name="UserList" component={UserListScreen} options={({ route }) => ({ title: route.params.title })} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Criar Conta' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;