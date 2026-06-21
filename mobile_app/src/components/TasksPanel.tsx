import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { agendaService } from '../services/agendaService';
import { Agenda } from '../types';
import { theme } from '../constants/theme';
import { isOverdue } from '../utils/dateHelpers';
import TaskListCard from './TaskListCard';
import CompleteTaskModal from './CompleteTaskModal';
import QuickInterventionModal from './QuickInterventionModal';
import TaskFilterModal from './TaskFilterModal';
import { RootStackParamList } from '../navigation/AppNavigator';

export interface TasksPanelHandle {
  /** Abre o modal de filtros (usado por um botão externo, ex.: header). */
  openFilter: () => void;
}

interface TasksPanelProps {
  /** Abre o modal de intervenção rápida automaticamente ao montar (deep-link). */
  autoOpenIntervention?: boolean;
  /** Notifica o pai quando há filtros ativos (para indicar no botão externo). */
  onFiltersActiveChange?: (active: boolean) => void;
  /** Mostra o FAB de intervenção rápida. Na Home usamos o botão central da tab bar. */
  showFab?: boolean;
}

const isToday = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const TasksPanel = forwardRef<TasksPanelHandle, TasksPanelProps>(
  ({ autoOpenIntervention, onFiltersActiveChange, showFab = true }, ref) => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [agendamentos, setAgendamentos] = useState<Agenda[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filtros
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [filterModalVisible, setFilterModalVisible] = useState(false);

    // Modais
    const [completeModalVisible, setCompleteModalVisible] = useState(false);
    const [selectedAgenda, setSelectedAgenda] = useState<Agenda | null>(null);
    const [interventionModalVisible, setInterventionModalVisible] = useState(false);

    const filtersActive = typeFilter !== 'ALL' || statusFilter !== 'ALL';

    useImperativeHandle(ref, () => ({ openFilter: () => setFilterModalVisible(true) }), []);

    useEffect(() => {
      onFiltersActiveChange?.(filtersActive);
    }, [filtersActive, onFiltersActiveChange]);

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

    // Abrir modal de intervenção via deep-link
    useEffect(() => {
      if (autoOpenIntervention) {
        setInterventionModalVisible(true);
      }
    }, [autoOpenIntervention]);

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

    // Próximos passos → editar tarefa pendente da planta
    const handleEditTask = (agenda: Agenda) => {
      setCompleteModalVisible(false);
      setSelectedAgenda(null);
      navigation.navigate('ScheduleCare', { plantaId: agenda.plantaId, agenda });
    };

    // Próximos passos → agendar nova tarefa para a planta
    const handleAddTask = (plantaId: string) => {
      setCompleteModalVisible(false);
      setSelectedAgenda(null);
      navigation.navigate('ScheduleCare', { plantaId });
    };

    // Aplicação dos filtros
    const filtered = useMemo(() => {
      let list = agendamentos;

      if (typeFilter !== 'ALL') {
        list = list.filter(a => (a.atividade?.nome || '').toLowerCase().includes(typeFilter));
      }

      list = list.filter(a => {
        switch (statusFilter) {
          case 'overdue':
            return a.status === 'PENDENTE' && isOverdue(a.dataAgendada);
          case 'today':
            return a.status === 'PENDENTE' && isToday(a.dataAgendada);
          case 'future':
            return a.status === 'PENDENTE' && !isOverdue(a.dataAgendada) && !isToday(a.dataAgendada);
          case 'done':
            return a.status === 'CONCLUIDO' || a.status === 'CANCELADO';
          case 'ALL':
          default:
            return a.status === 'PENDENTE';
        }
      });

      const sorted = [...list];
      if (statusFilter === 'done') {
        sorted.sort(
          (a, b) =>
            new Date(b.dataConcluida || b.dataAgendada).getTime() -
            new Date(a.dataConcluida || a.dataAgendada).getTime()
        );
      } else {
        sorted.sort((a, b) => new Date(a.dataAgendada).getTime() - new Date(b.dataAgendada).getTime());
      }
      return sorted;
    }, [agendamentos, typeFilter, statusFilter]);

    return (
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="leaf" size={56} color={theme.colors.primaryLight} />
            <Text style={styles.emptyTitle}>
              {filtersActive ? 'Nenhuma tarefa encontrada' : 'Tudo em dia!'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filtersActive ? 'Tente ajustar os filtros.' : 'Nenhuma tarefa pendente.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TaskListCard item={item} onComplete={handleQuickComplete} onPress={handleOpenComplete} />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          />
        )}

        {/* FAB — intervenção rápida */}
        {showFab && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setInterventionModalVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus" size={28} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Modais */}
        <TaskFilterModal
          isVisible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          typeFilter={typeFilter}
          statusFilter={statusFilter}
          onApply={(type, status) => {
            setTypeFilter(type);
            setStatusFilter(status);
          }}
        />

        <CompleteTaskModal
          isVisible={completeModalVisible}
          onClose={() => { setCompleteModalVisible(false); setSelectedAgenda(null); }}
          onTaskCompleted={handleTaskCompleted}
          agendaItem={selectedAgenda}
          allAgendas={agendamentos}
          onEditTask={handleEditTask}
          onAddTask={handleAddTask}
        />

        <QuickInterventionModal
          isVisible={interventionModalVisible}
          onClose={() => setInterventionModalVisible(false)}
          onCreated={handleInterventionCreated}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: theme.spacing.md,
    paddingBottom: 100,
  },
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

TasksPanel.displayName = 'TasksPanel';

export default TasksPanel;
