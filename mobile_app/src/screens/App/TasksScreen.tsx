import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { agendaService } from '../../services/agendaService';
import { Agenda } from '../../types';
import { theme } from '../../constants/theme';
import { isOverdue } from '../../utils/dateHelpers';
import FilterChips, { FilterOption } from '../../components/FilterChips';
import TaskListItem from '../../components/TaskListItem';

const priorityFilters: FilterOption[] = [
  { key: 'TODOS', label: 'Todas' },
  { key: 'URGENTE', label: 'Urgentes' },
  { key: 'PENDENTE', label: 'Pendentes' },
  { key: 'CONCLUIDO', label: 'Concluídos' },
];

const categoryFilters: FilterOption[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'aramacao', label: 'Aramação' },
  { key: 'adubacao', label: 'Adubação' },
  { key: 'transplante', label: 'Transplante' },
  { key: 'poda', label: 'Poda' },
  { key: 'rega', label: 'Rega' },
];

const TasksScreen = () => {
  const [agendamentos, setAgendamentos] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('TODOS');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await carregarAgenda();
    setIsRefreshing(false);
  };

  const handleComplete = async (id: string) => {
    try {
      await agendaService.updateAgendamento(id, {
        status: 'CONCLUIDO',
        dataConcluida: new Date().toISOString(),
      });
      await carregarAgenda();
    } catch {
      Alert.alert('Erro', 'Não foi possível concluir a tarefa.');
    }
  };

  const filtered = useMemo(() => {
    let result = [...agendamentos];

    // Filtro de prioridade
    if (priorityFilter === 'URGENTE') {
      result = result.filter(a => a.status === 'PENDENTE' && isOverdue(a.dataAgendada));
    } else if (priorityFilter === 'PENDENTE') {
      result = result.filter(a => a.status === 'PENDENTE');
    } else if (priorityFilter === 'CONCLUIDO') {
      result = result.filter(a => a.status === 'CONCLUIDO');
    }

    // Filtro de categoria
    if (categoryFilter !== 'ALL') {
      result = result.filter(a => {
        const nome = (a.atividade?.nome || '').toLowerCase();
        return nome.includes(categoryFilter);
      });
    }

    // Ordenação: atrasados primeiro, depois por data
    result.sort((a, b) => {
      const aOverdue = a.status === 'PENDENTE' && isOverdue(a.dataAgendada);
      const bOverdue = b.status === 'PENDENTE' && isOverdue(b.dataAgendada);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      if (a.status === 'PENDENTE' && b.status !== 'PENDENTE') return -1;
      if (a.status !== 'PENDENTE' && b.status === 'PENDENTE') return 1;
      return new Date(a.dataAgendada).getTime() - new Date(b.dataAgendada).getTime();
    });

    return result;
  }, [agendamentos, priorityFilter, categoryFilter]);

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
      <FilterChips filters={priorityFilters} activeKey={priorityFilter} onSelect={setPriorityFilter} />
      <FilterChips filters={categoryFilters} activeKey={categoryFilter} onSelect={setCategoryFilter} />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TaskListItem item={item} onComplete={handleComplete} />
        )}
        contentContainerStyle={filtered.length === 0 ? styles.centered : styles.list}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma tarefa encontrada.</Text>
          </View>
        }
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
  list: {
    paddingVertical: theme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.subtext,
  },
});

export default TasksScreen;
