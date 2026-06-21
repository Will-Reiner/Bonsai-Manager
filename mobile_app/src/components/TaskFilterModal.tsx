import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

export interface FilterChoice {
  key: string;
  label: string;
}

/** Filtros por tipo de tarefa. */
export const TYPE_FILTERS: FilterChoice[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'poda', label: 'Poda' },
  { key: 'rega', label: 'Rega' },
  { key: 'adubacao', label: 'Adubação' },
  { key: 'aramacao', label: 'Aramação' },
  { key: 'transplante', label: 'Transplante' },
];

/** Filtros por situação/prazo. */
export const STATUS_FILTERS: FilterChoice[] = [
  { key: 'ALL', label: 'Todas pendentes' },
  { key: 'overdue', label: 'Em atraso' },
  { key: 'today', label: 'Hoje' },
  { key: 'future', label: 'Próximas' },
  { key: 'done', label: 'Concluídas' },
];

interface TaskFilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  typeFilter: string;
  statusFilter: string;
  onApply: (typeFilter: string, statusFilter: string) => void;
}

const ChipGroup: React.FC<{
  options: FilterChoice[];
  activeKey: string;
  onSelect: (key: string) => void;
}> = ({ options, activeKey, onSelect }) => (
  <View style={styles.chipGroup}>
    {options.map(opt => {
      const active = opt.key === activeKey;
      return (
        <TouchableOpacity
          key={opt.key}
          style={[styles.chip, active && styles.chipActive]}
          onPress={() => onSelect(opt.key)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const TaskFilterModal: React.FC<TaskFilterModalProps> = ({
  isVisible,
  onClose,
  typeFilter,
  statusFilter,
  onApply,
}) => {
  const [tempType, setTempType] = useState(typeFilter);
  const [tempStatus, setTempStatus] = useState(statusFilter);

  // Sincroniza com os valores atuais sempre que o modal abre
  useEffect(() => {
    if (isVisible) {
      setTempType(typeFilter);
      setTempStatus(statusFilter);
    }
  }, [isVisible, typeFilter, statusFilter]);

  const handleApply = () => {
    onApply(tempType, tempStatus);
    onClose();
  };

  const handleClear = () => {
    setTempType('ALL');
    setTempStatus('ALL');
  };

  return (
    <Modal animationType="slide" transparent visible={isVisible} onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handleBar} />

          <View style={styles.headerRow}>
            <Text style={styles.title}>Filtrar tarefas</Text>
            <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearText}>Limpar</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Tipo de tarefa</Text>
          <ChipGroup options={TYPE_FILTERS} activeKey={tempType} onSelect={setTempType} />

          <Text style={styles.sectionLabel}>Situação</Text>
          <ChipGroup options={STATUS_FILTERS} activeKey={tempStatus} onSelect={setTempStatus} />

          <TouchableOpacity style={styles.applyButton} onPress={handleApply} activeOpacity={0.85}>
            <MaterialCommunityIcons name="filter-check" size={20} color="#fff" />
            <Text style={styles.applyText}>Aplicar filtros</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl + 16,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.subtext,
  },
  chipTextActive: {
    color: '#fff',
  },
  applyButton: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  applyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TaskFilterModal;
