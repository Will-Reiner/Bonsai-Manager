import React, { useState, useCallback, useMemo, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useRoute,
  useNavigation,
  RouteProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { agendaService } from '../../services/agendaService';
import { Agenda } from '../../types';
import { theme } from '../../constants/theme';
import { isOverdue } from '../../utils/dateHelpers';
import TaskListCard from '../../components/TaskListCard';
import CompleteTaskModal from '../../components/CompleteTaskModal';
import QuickInterventionModal from '../../components/QuickInterventionModal';
import TaskFilterModal from '../../components/TaskFilterModal';
import { RootStackParamList } from '../../navigation/AppNavigator';

type TasksScreenRouteProp = RouteProp<RootStackParamList, 'Tasks'>;
type TasksScreenNavProp = NativeStackNavigationProp<RootStackParamList, 'Tasks'>;

const isToday = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const TasksScreen = () => {
  const route = useRoute<TasksScreenRouteProp>();
  const navigation = useNavigation<TasksScreenNavProp>();

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

  // Botão de filtragem no header (ao lado direito do título)
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setFilterModalVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.headerButton}
        >
          <MaterialCommunityIcons name="filter-variant" size={24} color={theme.colors.primary} />
          {filtersActive && <View style={styles.headerButtonDot} />}
        </TouchableOpacity>
      ),
    });
  }, [navigation, filtersActive]);

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
      {filtered.length === 0 ? (
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
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setInterventionModalVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>

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
  headerButton: {
    paddingHorizontal: theme.spacing.sm,
  },
  headerButtonDot: {
    position: 'absolute',
    top: 0,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.urgent,
  },
  listContent: {
    paddingTop: theme.spacing.md,
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
