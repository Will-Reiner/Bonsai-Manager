import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Pressable,
  Image,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Planta, Atividade } from '../types';
import { plantaService } from '../services/plantaService';
import { atividadeService } from '../services/atividadeService';
import { agendaService } from '../services/agendaService';
import { theme } from '../constants/theme';
import { getActivityIcon } from '../utils/activityIcons';

interface QuickInterventionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const QuickInterventionModal: React.FC<QuickInterventionModalProps> = ({
  isVisible,
  onClose,
  onCreated,
}) => {
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [selectedPlantaId, setSelectedPlantaId] = useState<string | null>(null);
  const [selectedAtividadeId, setSelectedAtividadeId] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [jaRealizado, setJaRealizado] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setSelectedPlantaId(null);
      setSelectedAtividadeId(null);
      setObservacoes('');
      setJaRealizado(true);
      loadData();
    }
  }, [isVisible]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [plantasData, atividadesData] = await Promise.all([
        plantaService.getMinhasPlantas(),
        atividadeService.getAllAtividades(),
      ]);
      setPlantas(plantasData);
      setAtividades(atividadesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlantaId) {
      Alert.alert('Atenção', 'Selecione uma planta.');
      return;
    }
    if (!selectedAtividadeId) {
      Alert.alert('Atenção', 'Selecione uma atividade.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();

      if (jaRealizado) {
        // Cria agenda já concluída
        const agenda = await agendaService.createAgendamento({
          plantaId: selectedPlantaId,
          atividadeId: selectedAtividadeId,
          dataAgendada: now,
          observacoes: observacoes || undefined,
        });
        // Marca como concluída
        await agendaService.updateAgendamento(agenda.id, {
          status: 'CONCLUIDO',
          dataConcluida: now,
        });
      } else {
        // Cria agenda pendente para hoje
        await agendaService.createAgendamento({
          plantaId: selectedPlantaId,
          atividadeId: selectedAtividadeId,
          dataAgendada: now,
          observacoes: observacoes || undefined,
        });
      }

      Alert.alert('Sucesso', jaRealizado ? 'Intervenção registrada!' : 'Tarefa agendada para hoje!');
      onCreated();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível registrar a intervenção.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {/* Handle bar */}
            <View style={styles.handleBar} />

            <Text style={styles.title}>Intervenção Rápida</Text>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : (
              <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                {/* Seleção de planta */}
                <Text style={styles.sectionLabel}>Planta</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.plantaList}
                >
                  {plantas.map(planta => {
                    const isSelected = planta.id === selectedPlantaId;
                    const nome = planta.nome || planta.especie?.nomeComum || 'Planta';
                    return (
                      <TouchableOpacity
                        key={planta.id}
                        style={[styles.plantaCard, isSelected && styles.plantaCardSelected]}
                        onPress={() => setSelectedPlantaId(planta.id)}
                        activeOpacity={0.7}
                      >
                        {planta.fotoCapaUrl ? (
                          <Image source={{ uri: planta.fotoCapaUrl }} style={styles.plantaImage} />
                        ) : (
                          <View style={[styles.plantaImage, styles.plantaImageFallback]}>
                            <MaterialCommunityIcons
                              name="tree"
                              size={28}
                              color={isSelected ? '#fff' : theme.colors.primary}
                            />
                          </View>
                        )}
                        <Text
                          style={[styles.plantaName, isSelected && styles.plantaNameSelected]}
                          numberOfLines={2}
                        >
                          {nome}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {plantas.length === 0 && (
                    <Text style={styles.emptyText}>Nenhuma planta cadastrada</Text>
                  )}
                </ScrollView>

                {/* Seleção de atividade */}
                <Text style={styles.sectionLabel}>Atividade</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.atividadeList}
                >
                  {atividades.map(ativ => {
                    const isSelected = ativ.id === selectedAtividadeId;
                    const icon = getActivityIcon(ativ.nome);
                    return (
                      <TouchableOpacity
                        key={ativ.id}
                        style={[styles.atividadeChip, isSelected && styles.atividadeChipSelected]}
                        onPress={() => setSelectedAtividadeId(ativ.id)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name={icon as any}
                          size={16}
                          color={isSelected ? '#fff' : theme.colors.primary}
                        />
                        <Text
                          style={[styles.atividadeChipText, isSelected && styles.atividadeChipTextSelected]}
                        >
                          {ativ.nome}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Observações */}
                <Text style={styles.sectionLabel}>Observações (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Detalhes adicionais..."
                  placeholderTextColor={theme.colors.lightGray}
                  value={observacoes}
                  onChangeText={setObservacoes}
                  multiline
                />

                {/* Toggle já realizado */}
                <View style={styles.switchRow}>
                  <View>
                    <Text style={styles.switchLabel}>Já realizado?</Text>
                    <Text style={styles.switchHint}>
                      {jaRealizado ? 'Será registrado como concluído' : 'Será agendado como pendente'}
                    </Text>
                  </View>
                  <Switch
                    value={jaRealizado}
                    onValueChange={setJaRealizado}
                    trackColor={{ false: theme.colors.lightGray, true: theme.colors.primaryLight }}
                    thumbColor={jaRealizado ? theme.colors.primary : '#f4f3f4'}
                  />
                </View>

                {/* Botão registrar */}
                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="plus-circle" size={20} color="#fff" />
                      <Text style={styles.submitText}>Registrar</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </Pressable>
        </KeyboardAvoidingView>
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
  keyboardView: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl + 16,
    maxHeight: '85%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  loadingContainer: {
    paddingVertical: theme.spacing.xl * 2,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  // Plantas
  plantaList: {
    gap: 10,
    paddingBottom: theme.spacing.md,
  },
  plantaCard: {
    width: 80,
    alignItems: 'center',
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  plantaCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  plantaImage: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
  },
  plantaImageFallback: {
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plantaName: {
    fontSize: 11,
    color: theme.colors.subtext,
    textAlign: 'center',
    marginTop: 4,
  },
  plantaNameSelected: {
    color: theme.colors.primaryDark,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.subtext,
    fontStyle: 'italic',
  },
  // Atividades
  atividadeList: {
    gap: 8,
    paddingBottom: theme.spacing.md,
  },
  atividadeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.primaryLight,
    gap: 6,
  },
  atividadeChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  atividadeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  atividadeChipTextSelected: {
    color: '#fff',
  },
  // Input
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    height: 70,
    fontSize: 15,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    textAlignVertical: 'top',
  },
  // Switch
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  switchHint: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginTop: 2,
  },
  // Botões
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.lightGray,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  cancelText: {
    color: theme.colors.subtext,
    fontSize: 15,
    fontWeight: '500',
  },
});

export default QuickInterventionModal;
