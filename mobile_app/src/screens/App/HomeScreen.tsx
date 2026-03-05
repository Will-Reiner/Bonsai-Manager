import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../constants/theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { fetchHomeData, HomeData } from '../../services/homeService';
import { getCurrentSeason, getSeasonProgress, getTimeUntilNextSeason, getSeasonalTip } from '../../utils/dateHelpers';
import ProfileAvatar from '../../components/ProfileAvatar';
import SectionHeader from '../../components/SectionHeader';
import TaskCard from '../../components/TaskCard';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeNavigationProp>();
  const { user } = useAuth();
  const [data, setData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const result = await fetchHomeData();
      setData(result);
    } catch (err) {
      console.error('Erro ao carregar dados da Home:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadData().finally(() => setIsLoading(false));
    }, [loadData])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const season = getCurrentSeason();
  const progress = getSeasonProgress();
  const daysLeft = getTimeUntilNextSeason();
  const tip = getSeasonalTip();

  const firstName = user?.nome?.split(' ')[0] || 'Bonsaísta';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ProfileAvatar
            size={44}
            imageUrl={user?.fotoPerfilUrl}
            onPress={() => navigation.navigate('Settings')}
          />
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Bem-vindo,</Text>
            <Text style={styles.userName}>{firstName}</Text>
          </View>
        </View>
        <View style={styles.notificationIcon}>
          <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.subtext} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Card de Estação */}
        <View style={styles.seasonCard}>
          <View style={styles.seasonHeader}>
            <MaterialCommunityIcons
              name={season.icon as any}
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.seasonTitle}>{season.label}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.seasonSubtext}>
            {daysLeft} dias até a próxima estação
          </Text>
        </View>

        {/* Seção Tarefas */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : data ? (
          <>
            <SectionHeader
              title="Tarefas"
              actionLabel="ver todas"
              onAction={() => navigation.navigate('Tasks')}
            />

            {data.stats.tarefasAtrasadas > 0 && (
              <TaskCard
                icon="alert-circle"
                text="Tarefas em atraso"
                count={data.stats.tarefasAtrasadas}
                urgent
                onPress={() => navigation.navigate('Tasks')}
              />
            )}
            {data.stats.transplantePendente > 0 && (
              <TaskCard
                icon="shovel"
                text="Transplantes pendentes"
                count={data.stats.transplantePendente}
                onPress={() => navigation.navigate('Tasks')}
              />
            )}
            {data.stats.adubacaoSemana > 0 && (
              <TaskCard
                icon="flask"
                text="Adubação da semana"
                count={data.stats.adubacaoSemana}
                onPress={() => navigation.navigate('Tasks')}
              />
            )}
            {data.stats.plantasAtencao > 0 && (
              <TaskCard
                icon="flower"
                text="Plantas que precisam de atenção"
                count={data.stats.plantasAtencao}
                onPress={() => navigation.navigate('Tasks')}
              />
            )}
            {data.stats.tarefasPendentes === 0 && (
              <View style={styles.noTasksCard}>
                <MaterialCommunityIcons name="check-circle" size={32} color={theme.colors.success} />
                <Text style={styles.noTasksText}>Tudo em dia! Nenhuma tarefa pendente.</Text>
              </View>
            )}
          </>
        ) : null}

        {/* Card Gamificação (placeholder) */}
        <View style={styles.placeholderCard}>
          <MaterialCommunityIcons name="trophy-outline" size={28} color={theme.colors.accent} />
          <View style={styles.placeholderContent}>
            <Text style={styles.placeholderTitle}>Gamificação</Text>
            <Text style={styles.placeholderSubtext}>Em breve — metas e conquistas!</Text>
          </View>
        </View>

        {/* Card Dicas Sazonais */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <MaterialCommunityIcons name="lightbulb-outline" size={22} color={theme.colors.primary} />
            <Text style={styles.tipTitle}>Dica de {season.label}</Text>
          </View>
          <Text style={styles.tipText}>{tip}</Text>
        </View>

        <View style={{ height: theme.spacing.xl }} />
      </ScrollView>
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
  },
  headerText: {
    marginLeft: theme.spacing.sm,
  },
  greeting: {
    fontSize: 13,
    color: theme.colors.subtext,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
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
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.lightGray,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  seasonSubtext: {
    fontSize: 12,
    color: theme.colors.subtext,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  noTasksCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  noTasksText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  placeholderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    ...theme.shadows.soft,
    opacity: 0.7,
  },
  placeholderContent: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  placeholderSubtext: {
    fontSize: 13,
    color: theme.colors.subtext,
    marginTop: 2,
  },
  tipCard: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.md,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primaryDark,
    marginLeft: theme.spacing.sm,
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
});

export default HomeScreen;
