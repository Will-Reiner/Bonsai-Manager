import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Calendar, DateData } from 'react-native-calendars';
import { agendaService } from '../../services/agendaService';
import { plantaService } from '../../services/plantaService';
import { Agenda, AgendaStatus, Planta } from '../../types';
import AgendaListItem from '../../components/AgendaListItem';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { theme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type AgendaScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;
type StatusFilter = 'TODOS' | AgendaStatus;
type ViewMode = 'list' | 'calendar';

const AgendaScreen = () => {
  const navigation = useNavigation<AgendaScreenNavigationProp>();
  const [agendamentos, setAgendamentos] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPlantPicker, setShowPlantPicker] = useState(false);
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('TODOS');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const carregarAgenda = useCallback(async () => {
    try {
      setError(null);
      const data = await agendaService.getMinhaAgenda();
      setAgendamentos(data);
    } catch (err) {
      setError('Não foi possível carregar a sua agenda.');
      console.error(err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      carregarAgenda().finally(() => setIsLoading(false));
    }, [carregarAgenda])
  );
  
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await carregarAgenda();
    setIsRefreshing(false);
  }, [carregarAgenda]);

  const forceUpdate = () => {
      setIsLoading(true);
      carregarAgenda().finally(() => setIsLoading(false));
  };

  const handleAddAgendamento = async () => {
    try {
      const minhasPlantas = await plantaService.getMinhasPlantas();
      if (minhasPlantas.length === 0) {
        Alert.alert('Sem Plantas', 'Adicione uma planta à sua coleção antes de agendar um cuidado.');
        return;
      }
      setPlantas(minhasPlantas);
      setShowPlantPicker(true);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível carregar as suas plantas.');
    }
  };

  const handleSelectPlanta = (plantaId: string) => {
    setShowPlantPicker(false);
    navigation.navigate('ScheduleCare', { plantaId });
  };

  const filteredAgendamentos = useMemo(() => {
    let result = [...agendamentos];
    if (statusFilter !== 'TODOS') {
      result = result.filter(a => a.status === statusFilter);
    }
    // Pendentes primeiro (por data agendada crescente), depois concluídos/cancelados por data decrescente
    result.sort((a, b) => {
      if (a.status === 'PENDENTE' && b.status !== 'PENDENTE') return -1;
      if (a.status !== 'PENDENTE' && b.status === 'PENDENTE') return 1;
      return new Date(a.dataAgendada).getTime() - new Date(b.dataAgendada).getTime();
    });
    return result;
  }, [agendamentos, statusFilter]);

  const markedDates = useMemo(() => {
    const marks: Record<string, { dots: { key: string; color: string }[]; selected?: boolean; selectedColor?: string }> = {};
    const statusColors: Record<string, string> = {
      PENDENTE: theme.colors.accent,
      CONCLUIDO: theme.colors.primary,
      CANCELADO: theme.colors.danger,
    };

    for (const a of agendamentos) {
      const dateStr = a.dataAgendada.substring(0, 10);
      if (!marks[dateStr]) {
        marks[dateStr] = { dots: [] };
      }
      const color = statusColors[a.status] || theme.colors.subtext;
      if (!marks[dateStr].dots.find(d => d.color === color)) {
        marks[dateStr].dots.push({ key: a.status, color });
      }
    }

    if (selectedDate && marks[selectedDate]) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: theme.colors.primary };
    } else if (selectedDate) {
      marks[selectedDate] = { dots: [], selected: true, selectedColor: theme.colors.primary };
    }

    return marks;
  }, [agendamentos, selectedDate]);

  const agendamentosForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return agendamentos.filter(a => a.dataAgendada.substring(0, 10) === selectedDate);
  }, [agendamentos, selectedDate]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'TODOS', label: 'Todos' },
    { key: 'PENDENTE', label: 'Pendentes' },
    { key: 'CONCLUIDO', label: 'Concluídos' },
    { key: 'CANCELADO', label: 'Cancelados' },
  ];

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.infoText}>A carregar a sua agenda...</Text>
        </View>
      );
    }
  
    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={handleRefresh}>
              <Text style={styles.buttonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (agendamentos.length === 0) {
        return (
            <View style={styles.centered}>
                <Text style={styles.emptyText}>A sua agenda está vazia.</Text>
                <Text style={styles.emptySubtext}>Quando agendar um cuidado, ele aparecerá aqui!</Text>
            </View>
        );
    }

    return (
      <>
        <View style={styles.filterRow}>
          {statusFilters.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, statusFilter === f.key && styles.filterChipActive]}
              onPress={() => setStatusFilter(f.key)}
            >
              <Text style={[styles.filterChipText, statusFilter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <FlatList
            data={filteredAgendamentos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <AgendaListItem
                  item={item}
                  onUpdate={forceUpdate}
                />
            )}
            contentContainerStyle={styles.list}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={styles.infoText}>Nenhum agendamento com este filtro.</Text>
              </View>
            }
        />
      </>
    );
  }

  const renderCalendarView = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <ScrollView style={{ flex: 1 }}>
        <Calendar
          onDayPress={handleDayPress}
          markingType="multi-dot"
          markedDates={markedDates}
          theme={{
            todayTextColor: theme.colors.primary,
            arrowColor: theme.colors.primary,
            selectedDayBackgroundColor: theme.colors.primary,
            dotColor: theme.colors.primary,
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 13,
          }}
        />
        {selectedDate && (
          <View style={styles.calendarDaySection}>
            <Text style={styles.calendarDayTitle}>
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            {agendamentosForSelectedDate.length === 0 ? (
              <Text style={styles.infoText}>Nenhum agendamento neste dia.</Text>
            ) : (
              agendamentosForSelectedDate.map(item => (
                <AgendaListItem key={item.id} item={item} onUpdate={forceUpdate} />
              ))
            )}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Minha Agenda</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setViewMode(prev => prev === 'list' ? 'calendar' : 'list')} style={styles.viewToggle}>
            <MaterialCommunityIcons
              name={viewMode === 'list' ? 'calendar-month' : 'format-list-bulleted'}
              size={22}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAddAgendamento} style={styles.addButton}>
              <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'list' ? renderContent() : renderCalendarView()}

      <Modal visible={showPlantPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione uma Planta</Text>
            <FlatList
              data={plantas}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.plantPickerItem}
                  onPress={() => handleSelectPlanta(item.id)}
                >
                  <Text style={styles.plantPickerName}>{item.nome || item.especie?.nomeComum || item.especie?.nomeCientifico}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.infoText}>Nenhuma planta encontrada.</Text>}
            />
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowPlantPicker(false)}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
        padding: theme.spacing.large,
    },
    infoText: {
        marginTop: theme.spacing.small,
        fontSize: theme.typography.body.fontSize,
        color: theme.colors.subtext,
    },
    list: {
        paddingVertical: theme.spacing.small,
    },
    errorText: {
        fontSize: theme.typography.body.fontSize,
        color: theme.colors.danger,
        marginBottom: theme.spacing.large,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    emptySubtext: {
        fontSize: 14,
        color: theme.colors.subtext,
        marginTop: theme.spacing.small,
        textAlign: 'center',
    },
    button: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    buttonText: {
        color: theme.colors.card,
        fontSize: theme.typography.body.fontSize,
        fontWeight: 'bold',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.medium,
        paddingVertical: theme.spacing.small,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.lightGray,
    },
    headerTitle: {
        fontSize: theme.typography.h2.fontSize,
        fontWeight: theme.typography.h2.fontWeight as any,
        color: theme.colors.text,
    },
    addButton: {
        backgroundColor: theme.colors.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: theme.colors.card,
        fontSize: 24,
        lineHeight: 30,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: theme.spacing.medium,
        maxHeight: '60%',
    },
    modalTitle: {
        fontSize: theme.typography.h2.fontSize,
        fontWeight: theme.typography.h2.fontWeight as any,
        color: theme.colors.text,
        marginBottom: theme.spacing.medium,
        textAlign: 'center',
    },
    plantPickerItem: {
        paddingVertical: theme.spacing.medium,
        paddingHorizontal: theme.spacing.small,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.lightGray,
    },
    plantPickerName: {
        fontSize: theme.typography.body.fontSize,
        color: theme.colors.text,
    },
    modalCloseButton: {
        backgroundColor: theme.colors.subtext,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: theme.spacing.medium,
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.medium,
        paddingVertical: theme.spacing.small,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.lightGray,
    },
    filterChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    filterChipText: {
        fontSize: 13,
        color: theme.colors.subtext,
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: theme.colors.card,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    viewToggle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.lightGray,
    },
    calendarDaySection: {
        padding: theme.spacing.medium,
    },
    calendarDayTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.small,
        textTransform: 'capitalize',
    },
});

export default AgendaScreen;