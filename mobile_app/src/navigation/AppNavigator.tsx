import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import { theme } from '../constants/theme';

// Import screens
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import HomeScreen from '../screens/App/HomeScreen';
import CollectionScreen from '../screens/App/CollectionScreen';
import EncyclopediaScreen from '../screens/App/EncyclopediaScreen';
import CommunityScreen from '../screens/App/CommunityScreen';
import PlantDetailScreen from '../screens/App/PlantDetailScreen';
import AddPlantScreen from '../screens/App/AddPlantScreen';
import EditPlantScreen from '../screens/App/EditPlantScreen';
import AdminScreen from '../screens/App/AdminScreen';
import ScheduleCareScreen from '../screens/App/ScheduleCareScreen';
import InventoryScreen from '../screens/App/InventoryScreen';
import SpeciesListScreen from '../screens/App/SpeciesListScreen';
import SpeciesDetailScreen from '../screens/App/SpeciesDetailScreen';
import TechniquesListScreen from '../screens/App/TechniquesListScreen';
import TechniqueDetailScreen from '../screens/App/TechniqueDetailScreen';
import ProfileScreen from '../screens/App/ProfileScreen';
import EditProfileScreen from '../screens/App/EditProfileScreen';
import PublicProfileScreen from '../screens/App/PublicProfileScreen';
import UserListScreen from '../screens/App/UserListScreen';
import TasksScreen from '../screens/App/TasksScreen';
import SettingsScreen from '../screens/App/SettingsScreen';
import PhotoGalleryScreen from '../screens/App/PhotoGalleryScreen';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import PreferenciasScreen from '../screens/App/PreferenciasScreen';

// Import custom tab bar
import CustomTabBar from '../components/CustomTabBar';

import { useAuth } from '../context/AuthContext';
import { usePreferencias } from '../context/PreferenciasContext';
import { Usuario } from '../types';

// Tipos para o navegador principal (Stack)
export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
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
  EditProfile: undefined;
  Tasks: undefined;
  Settings: undefined;
  Inventory: undefined;
  PhotoGallery: { plantaId: string; plantaNome?: string };
  Preferencias: undefined;
  Home: undefined;
};

// Tipos para a navegação por abas (Tabs)
export type MainTabParamList = {
  Home: undefined;
  Collection: undefined;
  AddAction: undefined;
  Encyclopedia: undefined;
  Community: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Placeholder para o tab AddAction (nunca é renderizado, o botão abre modal)
const AddActionPlaceholder = () => <View />;

// Componente para a Navegação por Abas com custom tab bar
const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Collection" component={CollectionScreen} />
      <Tab.Screen name="AddAction" component={AddActionPlaceholder} />
      <Tab.Screen name="Encyclopedia" component={EncyclopediaScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { authState } = useAuth();
  const { isOnboardingComplete, isLoading: isLoadingPrefs } = usePreferencias();

  if (authState.isLoading || (authState.isAuthenticated && isLoadingPrefs)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!authState.isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Criar Conta' }} />
          </>
        ) : !isOnboardingComplete ? (
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false, gestureEnabled: false }}
          />
        ) : (
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
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Editar Perfil' }} />
            <Stack.Screen name="Tasks" component={TasksScreen} options={{ title: 'Tarefas' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configurações' }} />
            <Stack.Screen name="Inventory" component={InventoryScreen} options={{ title: 'Inventário' }} />
            <Stack.Screen name="PhotoGallery" component={PhotoGalleryScreen} options={{ title: 'Galeria de Fotos' }} />
            <Stack.Screen name="Preferencias" component={PreferenciasScreen} options={{ title: 'Preferências de Cuidado' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
