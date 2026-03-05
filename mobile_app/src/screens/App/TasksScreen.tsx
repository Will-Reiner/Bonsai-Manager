import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { agendaService } from '../../services/agendaService';
import { Agenda } from '../../types';
import { theme } from '../../constants/theme';
import { isOverdue } from '../../utils/dateHelpers';
import FilterChips, { FilterOption } from '../../components/FilterChips';
import TaskListItem from '../../components/TaskListItem';
import CompleteTaskModal from '../../components/CompleteTaskModal';
import QuickInterventionModal from '../../components/QuickInterventionModal';
import { RootStackParamList } from '../../navigation/AppNavigator';

type TasksScreenRouteProp = RouteProp<RootStackParamList, 'Tasks'>;

const categoryFilters: FilterOption[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'poda', label: 'Poda' },
  { key: 'rega', label: 'Rega' },
  { key: 'adubacao', label: 'Adubação' },
  { key: 'aramacao', label: 'Aramação' },
  { key: 'transplante', label: 'Transplante' },
];

interface Section {
  title: string;
  color: string;
  collapsible?: boolean;
  data: Agenda[];
}

const isToday = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isThisWeek = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  return date > today && date <= endOfWeek && !isToday(dateStr);
};

const TasksScreen = () => {
  const route = useRoute<TasksScreenRouteProp>();

  const [agendamentos, setAgendamentos] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [collapsedConcluidos, setCollapsedConcluidos] = useState(true);

  // Modais
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [selectedAgenda, setSelectedAgenda] = useState<Agenda | null>(null);
  const [interventionModalVisible, setInterventionModalVisible] = useState(false);

  const carregarAgenda = useCallback(async () => {
    try {
      const data = await agendaService.getMinhaAgenda();
      setAgendamentos(data);
    } catch (err) {
      console.error('Erro ao carregar agenda:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      carregarAgenda().finally(() => setIsLoading(false));
    }, [carregarAgenda])
  );

  // Abrir modal de intervenção se navegou com openIntervention
  useEffect(() => {
    if (route.params?.openIntervention) {
      setInterventionModalVisible(true);
    }
  }, [route.params]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await carregarAgenda();
    setIsRefreshing(false);
  };

  const handleOpenComplete = (item: Agenda) => {
    if (item.status === 'PENDENTE') {
      setSelectedAgenda(item);
      setCompleteModalVisible(true);
    }
  };

  const handleQuickComplete = (id: string) => {
    const item = agendamentos.find(a => a.id === id);
    if (item) {
      setSelectedAgenda(item);
      setCompleteModalVisible(true);
    }
  };

  const handleTaskCompleted = () => {
    setCompleteModalVisible(false);
    setSelectedAgenda(null);
    carregarAgenda();
  };

  const handleInterventionCreated = () => {
    setInterventionModalVisible(false);
    carregarAgenda();
  };

  // Filtrar por categoria
  const filtered = useMemo(() => {
    if (categoryFilter === 'ALL') return agendamentos;
    return agendamentos.filter(a => {
      const nome = (a.atividade?.nome || '').toLowerCase();
      return nome.includes(categoryFilter);
    });
  }, [agendamentos, categoryFilter]);

  // Contadores para os stat cards (antes do filtro de categoria)
  const stats = useMemo(() => {
    const pendentes = agendamentos.filter(a => a.status === 'PENDENTE');
    const atrasados = pendentes.filter(a => isOverdue(a.dataAgendada));
    const hoje = pendentes.filter(a => isToday(a.dataAgendada));
    const proximas = pendentes.filter(a => !isOverdue(a.dataAgendada) && !isToday(a.dataAgendada));
    return { atrasados: atrasados.length, hoje: hoje.length, proximas: proximas.length };
  }, [agendamentos]);

  // Agrupar em seções
  const sections = useMemo(() => {
    const result: Section[] = [];

    const overdueItems = filtered.filter(a => a.status === 'PENDENTE' && isOverdue(a.dataAgendada));
    const todayItems = filtered.filter(a => a.status === 'PENDENTE' && isToday(a.dataAgendada));
    const weekItems = filtered.filter(a => a.status === 'PENDENTE' && isThisWeek(a.dataAgendada));
    const futureItems = filtered.filter(a =>
      a.status === 'PENDENTE' && !isOverdue(a.dataAgendada) && !isToday(a.dataAgendada) && !isThisWeek(a.dataAgendada)
    );
    const doneItems = filtered.filter(a => a.status === 'CONCLUIDO' || a.status === 'CANCELADO');

    if (overdueItems.length > 0) {
      result.push({ title: 'Em Atraso', color: theme.colors.urgent, data: overdueItems });
    }
    if (todayItems.length > 0) {
      result.push({ title: 'Hoje', color: theme.colors.success, data: todayItems });
    }
    if (weekItems.length > 0) {
      result.push({ title: 'Esta Semana', color: theme.colors.subtext, data: weekItems });
    }
    if (futureItems.length > 0) {
      result.push({ title: 'Próximas', color: theme.colors.warning, data: futureItems });
    }
    if (doneItems.length > 0) {
      result.push({
        title: 'Concluídos',
        color: theme.colors.subtext,
        collapsible: true,
        data: collapsedConcluidos ? [] : doneItems,
      });
    }

    return result;
  }, [filtered, collapsedConcluidos]);

  // Verifica se não há nenhum pendente (para estado vazio)
  const noPendingTasks = useMemo(() => {
    return filtered.filter(a => a.status === 'PENDENTE').length === 0;
  }, [filtered]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Stats cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#FDECEA' }]}>
          <MaterialCommunityIcons name="alert-circle" size={18} color={theme.colors.urgent} />
          <Text style={[styles.statNumber, { color: theme.colors.urgent }]}>{stats.atrasados}</Text>
          <Text style={styles.statLabel}>Em Atraso</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <MaterialCommunityIcons name="calendar-today" size={18} color={theme.colors.success} />
          <Text style={[styles.statNumber, { color: theme.colors.success }]}>{stats.hoje}</Text>
          <Text style={styles.statLabel}>Hoje</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFF8E1' }]}>
          <MaterialCommunityIcons name="calendar-arrow-right" size={18} color={theme.colors.warning} />
          <Text style={[styles.statNumber, { color: theme.colors.warning }]}>{stats.proximas}</Text>
          <Text style={styles.statLabel}>Próximas</Text>
        </View>
      </View>

      {/* Filtros de categoria */}
      <FilterChips filters={categoryFilters} activeKey={categoryFilter} onSelect={setCategoryFilter} />

      {/* Lista agrupada */}
      {noPendingTasks && sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="leaf" size={56} color={theme.colors.primaryLight} />
          <Text style={styles.emptyTitle}>Tudo em dia!</Text>
          <Text style={styles.emptySubtitle}>Nenhuma tarefa pendente.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TaskListItem
              item={item}
              onComplete={handleQuickComplete}
              onPress={handleOpenComplete}
            />
          )}
          renderSectionHeader={({ section }) => (
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => {
                if (section.collapsible) {
                  setCollapsedConcluidos(prev => !prev);
                }
              }}
              activeOpacity={section.collapsible ? 0.7 : 1}
              disabled={!section.collapsible}
            >
              <View style={[styles.sectionDot, { backgroundColor: section.color }]} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.collapsible && (
                <MaterialCommunityIcons
                  name={collapsedConcluidos ? 'chevron-down' : 'chevron-up'}
                  size={20}
                  color={theme.colors.subtext}
                />
              )}
            </TouchableOpacity>
          )}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            noPendingTasks ? null : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptySubtitle}>Nenhuma tarefa nesta categoria.</Text>
              </View>
            )
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setInterventionModalVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modais */}
      <CompleteTaskModal
        isVisible={completeModalVisible}
        onClose={() => { setCompleteModalVisible(false); setSelectedAgenda(null); }}
        onTaskCompleted={handleTaskCompleted}
        agendaItem={selectedAgenda}
      />

      <QuickInterventionModal
        isVisible={interventionModalVisible}
        onClose={() => setInterventionModalVisible(false)}
        onCreated={handleInterventionCreated}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.subtext,
    fontWeight: '500',
  },
  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md + 4,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl * 2,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  emptySubtitle: {
    fontSize: 15,
    color: theme.colors.subtext,
    textAlign: 'center',
  },
  // FAB
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.elevated,
  },
});

export default TasksScreen;
