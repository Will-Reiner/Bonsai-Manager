import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

export interface FilterChoice {
  key: string;
  label: string;
}

export const TYPE_FILTERS: FilterChoice[] = [
  { key: 'TODAS', label: 'Todas' },
  { key: 'CONIFERA', label: 'Coníferas' },
  { key: 'ARVORE', label: 'Árvores' },
  { key: 'CADUCIFOLIA', label: 'Decíduas' },
  { key: 'ARBUSTO', label: 'Arbustos' },
  { key: 'OUTRAS', label: 'Outras' },
];

export const TASK_FILTERS: FilterChoice[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'pending', label: 'Com pendências' },
  { key: 'today', label: 'Para hoje' },
  { key: 'overdue', label: 'Atrasadas' },
];

interface PlantFilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  typeFilter: string;
  taskFilter: string;
  speciesFilter: string;
  /** Opções de espécie (inclui 'Todas'), montadas a partir da coleção. */
  speciesOptions: FilterChoice[];
  onApply: (typeFilter: string, taskFilter: string, speciesFilter: string) => void;
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
          <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const PlantFilterModal: React.FC<PlantFilterModalProps> = ({
  isVisible,
  onClose,
  typeFilter,
  taskFilter,
  speciesFilter,
  speciesOptions,
  onApply,
}) => {
  const [tempType, setTempType] = useState(typeFilter);
  const [tempTask, setTempTask] = useState(taskFilter);
  const [tempSpecies, setTempSpecies] = useState(speciesFilter);

  useEffect(() => {
    if (isVisible) {
      setTempType(typeFilter);
      setTempTask(taskFilter);
      setTempSpecies(speciesFilter);
    }
  }, [isVisible, typeFilter, taskFilter, speciesFilter]);

  const handleApply = () => {
    onApply(tempType, tempTask, tempSpecies);
    onClose();
  };

  const handleClear = () => {
    setTempType('TODAS');
    setTempTask('ALL');
    setTempSpecies('ALL');
  };

  return (
    <Modal animationType="slide" transparent visible={isVisible} onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handleBar} />

          <View style={styles.headerRow}>
            <Text style={styles.title}>Filtrar coleção</Text>
            <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearText}>Limpar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <Text style={styles.sectionLabel}>Tarefas</Text>
            <ChipGroup options={TASK_FILTERS} activeKey={tempTask} onSelect={setTempTask} />

            <Text style={styles.sectionLabel}>Tipo de planta</Text>
            <ChipGroup options={TYPE_FILTERS} activeKey={tempType} onSelect={setTempType} />

            {speciesOptions.length > 1 && (
              <>
                <Text style={styles.sectionLabel}>Espécie</Text>
                <ChipGroup options={speciesOptions} activeKey={tempSpecies} onSelect={setTempSpecies} />
              </>
            )}
          </ScrollView>

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
    maxHeight: '80%',
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
    marginBottom: theme.spacing.sm,
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
    marginTop: theme.spacing.md,
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

export default PlantFilterModal;
