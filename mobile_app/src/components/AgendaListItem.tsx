import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Agenda } from '../types';
import CompleteTaskModal from './CompleteTaskModal';
import { theme } from '../constants/theme';

interface AgendaListItemProps {
  item: Agenda;
  onUpdate: () => void; // Função para informar a tela pai que a lista precisa ser atualizada
}

const AgendaListItem: React.FC<AgendaListItemProps> = ({ item, onUpdate }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const dataAgendada = new Date(item.dataAgendada).toLocaleDateString('pt-BR');

  const handleTaskCompleted = () => {
    setModalVisible(false);
    onUpdate(); // Chama a função de atualização
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateDay}>{new Date(item.dataAgendada).getDate()}</Text>
          <Text style={styles.dateMonth}>{new Date(item.dataAgendada).toLocaleString('pt-BR', { month: 'short' })}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.activityTitle}>{item.atividade?.nome}</Text>
          <Text style={styles.plantName}>{item.planta?.nome || 'Planta sem nome'}</Text>
          {item.observacoes && <Text style={styles.observationText}>Obs: {item.observacoes}</Text>}

          <View style={styles.footer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>

            {item.status === 'PENDENTE' && (
              <TouchableOpacity style={styles.completeButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.completeButtonText}>Concluir</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      
      <CompleteTaskModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        onTaskCompleted={handleTaskCompleted}
        agendaItem={item}
      />
    </>
  );
};

// ... (função getStatusColor e estilos)
const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDENTE': return '#ffc107';
    case 'CONCLUIDO': return '#28a745';
    case 'CANCELADO': return '#dc3545';
    default: return '#6c757d';
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateContainer: {
    padding: theme.spacing.sm,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    marginRight: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  dateDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  dateMonth: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  infoContainer: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  plantName: {
    fontSize: 16,
    color: theme.colors.text,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  observationText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 20,
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default AgendaListItem;