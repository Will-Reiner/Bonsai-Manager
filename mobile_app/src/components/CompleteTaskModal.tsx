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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Agenda, UpdateAgendaDTO } from '../types';
import { agendaService } from '../services/agendaService';
import { theme } from '../constants/theme';
import { getActivityIcon } from '../utils/activityIcons';

interface CompleteTaskModalProps {
  isVisible: boolean;
  onClose: () => void;
  onTaskCompleted: () => void;
  agendaItem: Agenda | null;
}

const CompleteTaskModal: React.FC<CompleteTaskModalProps> = ({
  isVisible,
  onClose,
  onTaskCompleted,
  agendaItem,
}) => {
  const [detalhes, setDetalhes] = useState('');
  const [observacaoFutura, setObservacaoFutura] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setDetalhes('');
      setObservacaoFutura('');
    }
  }, [isVisible]);

  if (!agendaItem) return null;

  const atividadeNome = agendaItem.atividade?.nome || 'Atividade';
  const plantaNome = agendaItem.planta?.nome || agendaItem.planta?.especie?.nomeComum || 'Planta';
  const activityIcon = getActivityIcon(atividadeNome);

  const handleCompleteTask = async () => {
    setIsSubmitting(true);
    try {
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

              {/* Campos */}
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

              {/* Botões */}
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
                onPress={handleCompleteTask}
                disabled={isSubmitting}
                activeOpacity={0.8}
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

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
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
  cancelText: {
    color: theme.colors.subtext,
    fontSize: 15,
    fontWeight: '500',
  },
});

export default CompleteTaskModal;
