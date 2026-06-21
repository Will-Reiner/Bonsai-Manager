import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Agenda } from '../types';
import { theme } from '../constants/theme';
import { isOverdue } from '../utils/dateHelpers';
import { getActivityIcon } from '../utils/activityIcons';

interface TaskListCardProps {
  item: Agenda;
  onComplete?: (id: string) => void;
  onPress?: (item: Agenda) => void;
}

const screenWidth = Dimensions.get('window').width;
// Imagem grande à esquerda — ~1/3 da largura do card
const IMAGE_WIDTH = Math.round((screenWidth - theme.spacing.md * 2) / 3);

const isToday = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/** Data absoluta amigável: "21 jun 2026". */
const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const TaskListCard: React.FC<TaskListCardProps> = ({ item, onComplete, onPress }) => {
  const atividadeNome = item.atividade?.nome || 'Atividade';
  const plantaNome = item.planta?.nome;
  const identificador = item.planta?.identificador;
  const observacoes = item.observacoes;
  const fotoUrl = (item.planta as any)?.fotoCapaUrl;

  const overdue = item.status === 'PENDENTE' && isOverdue(item.dataAgendada);
  const today = item.status === 'PENDENTE' && isToday(item.dataAgendada);
  const isPending = item.status === 'PENDENTE';

  const getStatusConfig = () => {
    if (item.status === 'CONCLUIDO') return { label: 'Concluído', bg: '#E8F5E9', color: theme.colors.success };
    if (item.status === 'CANCELADO') return { label: 'Cancelado', bg: '#F5F5F5', color: theme.colors.subtext };
    if (overdue) return { label: 'Em Atraso', bg: '#FDECEA', color: theme.colors.urgent };
    if (today) return { label: 'Hoje', bg: '#E8F5E9', color: theme.colors.success };
    return { label: 'Próxima', bg: '#FFF8E1', color: theme.colors.warning };
  };

  const status = getStatusConfig();
  const activityIcon = getActivityIcon(atividadeNome);

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress?.(item)} activeOpacity={0.7}>
      {/* Imagem grande do bonsai à esquerda */}
      <View style={styles.imageContainer}>
        {fotoUrl ? (
          <Image source={{ uri: fotoUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <MaterialCommunityIcons name="tree" size={36} color={theme.colors.primary} />
          </View>
        )}
      </View>

      {/* Corpo: informações + botão de check */}
      <View style={styles.body}>
        <View style={styles.textCol}>
          {/* Nome da tarefa em destaque */}
          <View style={styles.titleRow}>
            <MaterialCommunityIcons name={activityIcon as any} size={16} color={theme.colors.primary} />
            <Text style={styles.title} numberOfLines={1}>{atividadeNome}</Text>
          </View>

          {/* ID (caso tenha) */}
          {!!identificador && (
            <View style={styles.metaLine}>
              <MaterialCommunityIcons name="pound" size={12} color={theme.colors.subtext} />
              <Text style={styles.metaText} numberOfLines={1}>{identificador}</Text>
            </View>
          )}

          {/* Nome da planta (caso tenha) */}
          {!!plantaNome && (
            <View style={styles.metaLine}>
              <MaterialCommunityIcons name="sprout" size={12} color={theme.colors.subtext} />
              <Text style={styles.metaText} numberOfLines={1}>{plantaNome}</Text>
            </View>
          )}

          {/* Status + data */}
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
            <Text style={styles.dateText}>{formatDate(item.dataAgendada)}</Text>
          </View>

          {/* Observação (caso exista) */}
          {!!observacoes && (
            <View style={styles.obsBox}>
              <Text style={styles.obsText} numberOfLines={3}>{observacoes}</Text>
            </View>
          )}
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
              size={22}
              color={overdue ? theme.colors.urgent : theme.colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    minHeight: 120,
    ...theme.shadows.soft,
  },
  imageContainer: {
    width: IMAGE_WIDTH,
  },
  image: {
    width: '100%',
    height: '100%',
    minHeight: 120,
  },
  imageFallback: {
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  textCol: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.subtext,
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
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
  obsBox: {
    marginTop: 6,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  obsText: {
    fontSize: 12,
    color: theme.colors.subtext,
    fontStyle: 'italic',
  },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  checkButtonOverdue: {
    backgroundColor: '#FDECEA',
  },
});

export default TaskListCard;
