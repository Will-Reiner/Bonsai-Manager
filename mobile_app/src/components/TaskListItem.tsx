import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Agenda } from '../types';
import { theme } from '../constants/theme';
import { isOverdue } from '../utils/dateHelpers';
import { getActivityIcon } from '../utils/activityIcons';

interface TaskListItemProps {
  item: Agenda;
  onComplete?: (id: string) => void;
  onPress?: (item: Agenda) => void;
}

/**
 * Retorna texto relativo para a data (Hoje, Ontem, Amanhã, Em X dias, Há X dias).
 */
const getRelativeDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffMs = date.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === -1) return 'Ontem';
  if (diffDays === 1) return 'Amanhã';
  if (diffDays > 1 && diffDays <= 7) return `Em ${diffDays} dias`;
  if (diffDays < -1 && diffDays >= -7) return `Há ${Math.abs(diffDays)} dias`;

  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

const TaskListItem: React.FC<TaskListItemProps> = ({ item, onComplete, onPress }) => {
  const atividadeNome = item.atividade?.nome || 'Atividade';
  const plantaNome = item.planta?.nome || item.planta?.especie?.nomeComum || 'Planta';
  const overdue = item.status === 'PENDENTE' && isOverdue(item.dataAgendada);
  const isPending = item.status === 'PENDENTE';
  const fotoUrl = (item.planta as any)?.fotoCapaUrl;

  const getStatusConfig = () => {
    if (overdue) return { label: 'Em Atraso', bg: '#FDECEA', color: theme.colors.urgent };
    if (item.status === 'CONCLUIDO') return { label: 'Concluído', bg: '#E8F5E9', color: theme.colors.success };
    if (item.status === 'CANCELADO') return { label: 'Cancelado', bg: '#F5F5F5', color: theme.colors.subtext };
    return { label: 'Pendente', bg: theme.colors.primaryLight, color: theme.colors.primary };
  };

  const status = getStatusConfig();
  const activityIcon = getActivityIcon(atividadeNome);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(item)}
      activeOpacity={0.7}
    >
      {/* Thumbnail da planta */}
      <View style={styles.thumbnailContainer}>
        {fotoUrl ? (
          <Image source={{ uri: fotoUrl }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailFallback]}>
            <MaterialCommunityIcons name="tree" size={24} color={theme.colors.primary} />
          </View>
        )}
      </View>

      {/* Conteúdo central */}
      <View style={styles.content}>
        <View style={styles.activityRow}>
          <MaterialCommunityIcons
            name={activityIcon as any}
            size={14}
            color={theme.colors.subtext}
          />
          <Text style={styles.atividadeText} numberOfLines={1}>{atividadeNome}</Text>
        </View>
        <Text style={styles.plantaText} numberOfLines={1}>{plantaNome}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.dateText}>{getRelativeDate(item.dataAgendada)}</Text>
        </View>
      </View>

      {/* Botão de check para tarefas pendentes */}
      {isPending && onComplete && (
        <TouchableOpacity
          style={[styles.checkButton, overdue && styles.checkButtonOverdue]}
          onPress={(e) => {
            e.stopPropagation?.();
            onComplete(item.id);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons
            name="check"
            size={20}
            color={overdue ? theme.colors.urgent : theme.colors.primary}
          />
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  thumbnailContainer: {
    marginRight: theme.spacing.md,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
  },
  thumbnailFallback: {
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  atividadeText: {
    fontSize: 12,
    color: theme.colors.subtext,
    fontWeight: '500',
  },
  plantaText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.subtext,
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  checkButtonOverdue: {
    backgroundColor: '#FDECEA',
  },
});

export default TaskListItem;
