import React, { useState, useEffect, useMemo } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Agenda, UpdateAgendaDTO } from '../types';
import { agendaService } from '../services/agendaService';
import { fotoService } from '../services/fotoService';
import { theme } from '../constants/theme';
import { getActivityIcon } from '../utils/activityIcons';
import { isOverdue } from '../utils/dateHelpers';
import { useMediaUpload } from '../hooks/useMediaUpload';
import { UploadProgressBar } from './UploadProgressBar';

interface CompleteTaskModalProps {
  isVisible: boolean;
  onClose: () => void;
  onTaskCompleted: () => void;
  agendaItem: Agenda | null;
  /** Todas as agendas do utilizador — usado para listar os próximos passos da planta. */
  allAgendas?: Agenda[];
  /** Abre a tela de edição de uma tarefa pendente (próximos passos). */
  onEditTask?: (agenda: Agenda) => void;
  /** Abre a tela de agendamento de uma nova tarefa para a planta. */
  onAddTask?: (plantaId: string) => void;
}

const isToday = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

const getMiniStatus = (a: Agenda) => {
  if (isOverdue(a.dataAgendada)) return { label: 'Em Atraso', bg: '#FDECEA', color: theme.colors.urgent };
  if (isToday(a.dataAgendada)) return { label: 'Hoje', bg: '#E8F5E9', color: theme.colors.success };
  return { label: 'Próxima', bg: '#FFF8E1', color: theme.colors.warning };
};

/** Barra de etapas (1 de 2 / 2 de 2). */
const StepBar: React.FC<{ current: 1 | 2 }> = ({ current }) => (
  <View style={styles.stepBarContainer}>
    <View style={styles.stepLabelRow}>
      <Text style={styles.stepLabel}>Etapa {current} de 2</Text>
      {current === 2 && (
        <MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.success} />
      )}
    </View>
    <View style={styles.stepTrack}>
      <View
        style={[
          styles.stepFill,
          { width: current === 1 ? '50%' : '100%' },
        ]}
      />
    </View>
  </View>
);

const CompleteTaskModal: React.FC<CompleteTaskModalProps> = ({
  isVisible,
  onClose,
  onTaskCompleted,
  agendaItem,
  allAgendas,
  onEditTask,
  onAddTask,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [detalhes, setDetalhes] = useState('');
  const [observacaoFutura, setObservacaoFutura] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { upload, isUploading, progress, phase, reset: resetUpload } = useMediaUpload();

  useEffect(() => {
    if (isVisible) {
      setStep(1);
      setFotoUri(null);
      setFotoUrl(null);
      setDetalhes('');
      setObservacaoFutura('');
      resetUpload();
    }
  }, [isVisible, resetUpload]);

  // Próximos passos: tarefas pendentes da mesma planta (exceto a atual)
  const proximosPassos = useMemo(() => {
    if (!agendaItem) return [];
    return (allAgendas || [])
      .filter(a => a.plantaId === agendaItem.plantaId && a.status === 'PENDENTE' && a.id !== agendaItem.id)
      .sort((a, b) => new Date(a.dataAgendada).getTime() - new Date(b.dataAgendada).getTime());
  }, [allAgendas, agendaItem]);

  if (!agendaItem) return null;

  const atividadeNome = agendaItem.atividade?.nome || 'Atividade';
  const plantaNome = agendaItem.planta?.nome || agendaItem.planta?.especie?.nomeComum || 'Planta';
  const activityIcon = getActivityIcon(atividadeNome);

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para adicionar uma foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setFotoUri(asset.uri);

    try {
      const { publicUrl } = await upload(asset.uri, asset.mimeType || 'image/jpeg');
      setFotoUrl(publicUrl);
    } catch {
      setFotoUri(null);
      setFotoUrl(null);
      Alert.alert('Erro', 'Não foi possível enviar a foto. Tente novamente.');
    }
  };

  const handleRemovePhoto = () => {
    setFotoUri(null);
    setFotoUrl(null);
    resetUpload();
  };

  const handleCompleteTask = async () => {
    setIsSubmitting(true);
    try {
      // Foto da intervenção (opcional) — registrada na galeria da planta
      if (fotoUrl) {
        await fotoService.createFoto({
          caminhoArquivo: fotoUrl,
          plantaId: agendaItem.plantaId,
          tipo: 'FOTO',
          titulo: atividadeNome,
          descricao: detalhes || undefined,
        });
      }

      const updateData: UpdateAgendaDTO = {
        status: 'CONCLUIDO',
        dataConcluida: new Date().toISOString(),
        detalhes: detalhes || undefined,
        observacaoFutura: observacaoFutura || undefined,
      };

      await agendaService.updateAgendamento(agendaItem.id, updateData);
      Alert.alert('Sucesso', 'Tarefa concluída e registrada no histórico!');
      onTaskCompleted();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível concluir a tarefa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal animationType="slide" transparent visible={isVisible} onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {/* Handle bar */}
              <View style={styles.handleBar} />

              {/* Header com ícone + info */}
              <View style={styles.header}>
                <View style={styles.headerIcon}>
                  <MaterialCommunityIcons name={activityIcon as any} size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.headerInfo}>
                  <Text style={styles.headerTitle}>{atividadeNome}</Text>
                  <Text style={styles.headerSubtitle}>{plantaNome}</Text>
                </View>
              </View>

              {step === 1 ? (
                /* ---------------- ETAPA 1: Foto da intervenção ---------------- */
                <>
                  <Text style={styles.label}>Foto da Intervenção (opcional)</Text>
                  {fotoUri ? (
                    <View style={styles.photoPreviewContainer}>
                      <Image source={{ uri: fotoUri }} style={styles.photoPreview} />
                      {!isUploading && (
                        <TouchableOpacity style={styles.removePhotoButton} onPress={handleRemovePhoto}>
                          <MaterialCommunityIcons name="close-circle" size={28} color={theme.colors.danger} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.photoPlaceholder}
                      onPress={handlePickPhoto}
                      disabled={isUploading}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="camera-plus-outline" size={40} color={theme.colors.subtext} />
                      <Text style={styles.photoPlaceholderText}>Adicionar foto da intervenção</Text>
                    </TouchableOpacity>
                  )}

                  <UploadProgressBar progress={progress} phase={phase} visible={isUploading} />

                  {/* Barra de etapas + botão continuar (lado a lado) */}
                  <View style={styles.stepRow}>
                    <View style={styles.stepRowBar}>
                      <StepBar current={1} />
                    </View>
                    <TouchableOpacity
                      style={[styles.continueButton, isUploading && styles.buttonDisabled]}
                      onPress={() => setStep(2)}
                      disabled={isUploading}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.continueText}>Continuar</Text>
                      <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </TouchableOpacity>
                </>
              ) : (
                /* ---------------- ETAPA 2: Detalhes + Próximos passos ---------------- */
                <>
                  <Text style={styles.label}>Detalhes da Realização</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Ex: Podei 3 galhos, apliquei pasta cicatrizante..."
                    placeholderTextColor={theme.colors.lightGray}
                    value={detalhes}
                    onChangeText={setDetalhes}
                    multiline
                  />

                  <Text style={styles.label}>Observações para o Futuro</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Verificar brotação em 2 semanas."
                    placeholderTextColor={theme.colors.lightGray}
                    value={observacaoFutura}
                    onChangeText={setObservacaoFutura}
                  />

                  {/* Próximos passos */}
                  <Text style={styles.label}>Próximos Passos</Text>
                  {proximosPassos.length === 0 ? (
                    <Text style={styles.emptyNextSteps}>
                      Nenhuma tarefa pendente para esta planta.
                    </Text>
                  ) : (
                    proximosPassos.map(passo => {
                      const miniStatus = getMiniStatus(passo);
                      const passoIcon = getActivityIcon(passo.atividade?.nome || '');
                      return (
                        <TouchableOpacity
                          key={passo.id}
                          style={styles.nextStepCard}
                          onPress={() => onEditTask?.(passo)}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons
                            name={passoIcon as any}
                            size={18}
                            color={theme.colors.primary}
                          />
                          <View style={styles.nextStepInfo}>
                            <Text style={styles.nextStepName} numberOfLines={1}>
                              {passo.atividade?.nome || 'Atividade'}
                            </Text>
                            <View style={styles.nextStepMeta}>
                              <View style={[styles.statusBadge, { backgroundColor: miniStatus.bg }]}>
                                <Text style={[styles.statusText, { color: miniStatus.color }]}>
                                  {miniStatus.label}
                                </Text>
                              </View>
                              <Text style={styles.nextStepDate}>{formatDate(passo.dataAgendada)}</Text>
                            </View>
                          </View>
                          <MaterialCommunityIcons
                            name="chevron-right"
                            size={20}
                            color={theme.colors.subtext}
                          />
                        </TouchableOpacity>
                      );
                    })
                  )}

                  {/* Adicionar nova tarefa para a planta */}
                  <TouchableOpacity
                    style={styles.addTaskButton}
                    onPress={() => onAddTask?.(agendaItem.plantaId)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color={theme.colors.primary} />
                    <Text style={styles.addTaskText}>Adicionar nova tarefa</Text>
                  </TouchableOpacity>

                  {/* Barra de etapas completa */}
                  <StepBar current={2} />

                  {/* Botão concluir */}
                  <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
                    onPress={handleCompleteTask}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                        <Text style={styles.submitText}>Concluir Tarefa</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)} disabled={isSubmitting}>
                    <MaterialCommunityIcons name="arrow-left" size={18} color={theme.colors.subtext} />
                    <Text style={styles.cancelText}>Voltar</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
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
    marginBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginTop: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
    marginTop: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    height: 48,
    fontSize: 15,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.md,
  },
  // Foto
  photoPlaceholder: {
    height: 160,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.lightGray,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  photoPlaceholderText: {
    fontSize: 15,
    color: theme.colors.subtext,
  },
  photoPreviewContainer: {
    position: 'relative',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 14,
  },
  // Step bar
  stepBarContainer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  stepLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.subtext,
  },
  stepTrack: {
    height: 6,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  stepFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  stepRowBar: {
    flex: 1,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  continueText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  // Próximos passos
  emptyNextSteps: {
    fontSize: 13,
    color: theme.colors.subtext,
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
  },
  nextStepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  nextStepInfo: {
    flex: 1,
    gap: 4,
  },
  nextStepName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  nextStepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextStepDate: {
    fontSize: 12,
    color: theme.colors.subtext,
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
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  addTaskText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  // Botões finais
  submitButton: {
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: theme.spacing.sm,
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    marginTop: theme.spacing.xs,
  },
  cancelText: {
    color: theme.colors.subtext,
    fontSize: 15,
    fontWeight: '500',
  },
});

export default CompleteTaskModal;
