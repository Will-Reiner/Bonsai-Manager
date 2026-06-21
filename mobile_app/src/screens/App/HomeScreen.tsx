import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../constants/theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { getCurrentSeason, getSeasonProgress } from '../../utils/dateHelpers';
import ProfileAvatar from '../../components/ProfileAvatar';
import TasksPanel, { TasksPanelHandle } from '../../components/TasksPanel';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeNavigationProp>();
  const { user } = useAuth();

  const panelRef = useRef<TasksPanelHandle>(null);
  const [filtersActive, setFiltersActive] = useState(false);

  const season = getCurrentSeason();
  const progress = getSeasonProgress();
  const firstName = user?.nome?.split(' ')[0] || 'Bonsaísta';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header: avatar + boas-vindas + filtro */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ProfileAvatar
            size={44}
            imageUrl={user?.fotoPerfilUrl}
            onPress={() => navigation.navigate('Settings')}
          />
          <Text style={styles.greeting}>
            Bem-vindo, <Text style={styles.userName}>{firstName}</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => panelRef.current?.openFilter()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="filter-variant" size={24} color={theme.colors.primary} />
          {filtersActive && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Card de estação — apenas a barra de progresso, sem texto/% */}
      <View style={styles.seasonCard}>
        <View style={styles.seasonHeader}>
          <MaterialCommunityIcons name={season.icon as any} size={24} color={theme.colors.primary} />
          <Text style={styles.seasonTitle}>{season.label}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* Tarefas — mesmo conteúdo da página de tarefas (sem FAB: usamos o botão central) */}
      <TasksPanel ref={panelRef} onFiltersActiveChange={setFiltersActive} showFab={false} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: theme.colors.subtext,
    marginLeft: theme.spacing.sm,
    flexShrink: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.urgent,
  },
  seasonCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    ...theme.shadows.soft,
  },
  seasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  seasonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.lightGray,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
});

export default HomeScreen;
