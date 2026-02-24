import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Agenda } from '../types';
import { theme } from '../constants/theme';
import { isOverdue } from '../utils/dateHelpers';

interface TaskListItemProps {
  item: Agenda;
  onComplete?: (id: string) => void;
  onPress?: (item: Agenda) => void;
}

const TaskListItem: React.FC<TaskListItemProps> = ({ item, onComplete, onPress }) => {
  const [expanded, setExpanded] = useState(false);

  const atividadeNome = item.atividade?.nome || 'Atividade';
  const plantaNome = item.planta?.nome || item.planta?.especie?.nomeComum || 'Planta';
  const dataFormatada = new Date(item.dataAgendada).toLocaleDateString('pt-BR');
  const overdue = item.status === 'PENDENTE' && isOverdue(item.dataAgendada);

  const getPriorityColor = () => {
    if (overdue) return theme.colors.urgent;
    if (item.status === 'CONCLUIDO') return theme.colors.success;
    if (item.status === 'CANCELADO') return theme.colors.subtext;
    return theme.colors.normal;
  };

  const getStatusLabel = () => {
    if (overdue) return 'Em atraso';
    if (item.status === 'CONCLUIDO') return 'Concluído';
    if (item.status === 'CANCELADO') return 'Cancelado';
    return 'Pendente';
  };

  return (
    <TouchableOpacity
      style={[styles.container, overdue && styles.overdueContainer]}
      onPress={() => {
        if (onPress) onPress(item);
        else setExpanded(!expanded);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.mainRow}>
        <View style={[styles.statusDot, { backgroundColor: getPriorityColor() }]} />
        <View style={styles.content}>
          <Text style={styles.atividade} numberOfLines={1}>{atividadeNome}</Text>
          <Text style={styles.planta} numberOfLines={1}>{plantaNome}</Text>
        </View>
        <View style={styles.rightColumn}>
          <Text style={styles.data}>{dataFormatada}</Text>
          <Text style={[styles.badge, { color: getPriorityColor() }]}>
            {getStatusLabel()}
          </Text>
        </View>
      </View>

      {expanded && (
        <View style={styles.expandedContent}>
          {item.detalhes ? (
            <Text style={styles.detailText}>{item.detalhes}</Text>
          ) : null}
          {item.observacoes ? (
            <Text style={styles.detailText}>{item.observacoes}</Text>
          ) : null}

          {item.status === 'PENDENTE' && onComplete && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => onComplete(item.id)}
              >
                <MaterialCommunityIcons name="check" size={18} color={theme.colors.card} />
                <Text style={styles.completeText}>Marcar feito</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    ...theme.shadows.soft,
  },
  overdueContainer: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.urgent,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: theme.spacing.sm,
  },
  content: {
    flex: 1,
  },
  atividade: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  planta: {
    fontSize: 13,
    color: theme.colors.subtext,
    marginTop: 2,
  },
  rightColumn: {
    alignItems: 'flex-end',
    marginLeft: theme.spacing.sm,
  },
  data: {
    fontSize: 13,
    color: theme.colors.subtext,
  },
  badge: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  expandedContent: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.sm,
    gap: 6,
  },
  completeText: {
    color: theme.colors.card,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default TaskListItem;
