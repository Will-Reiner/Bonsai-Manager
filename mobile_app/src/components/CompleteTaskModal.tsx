import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Agenda } from '../types';
import { historicoService } from '../services/historicoService';
import { agendaService } from '../services/agendaService';

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
  const [recursosUtilizados, setRecursosUtilizados] = useState('');
  const [observacaoFutura, setObservacaoFutura] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!agendaItem) {
    return null;
  }

  const handleCompleteTask = async () => {
    setIsSubmitting(true);
    try {
      // 1. Criar o registro no histórico
      await historicoService.createRegistroHistorico({
        plantaId: agendaItem.plantaId,
        dataRealizacao: new Date().toISOString(),
        atividadeRealizada: agendaItem.atividade?.nome || 'Atividade desconhecida',
        detalhes: detalhes || undefined,
        recursosUtilizados: recursosUtilizados || undefined,
        observacaoFutura: observacaoFutura || undefined,
      });

      // 2. Atualizar o status da agenda para "CONCLUIDO"
      await agendaService.updateAgendamento(agendaItem.id, {
        status: 'CONCLUIDO',
        dataConcluida: new Date().toISOString(),
      });

      Alert.alert('Sucesso', 'Tarefa concluída e registrada no histórico!');
      onTaskCompleted(); // Chama a função para fechar o modal e atualizar a lista
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
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Concluir: {agendaItem.atividade?.nome}</Text>
          <Text style={styles.modalSubtitle}>Para: {agendaItem.planta?.nome || 'Planta'}</Text>

          <Text style={styles.label}>Detalhes da Realização</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ex: Podei 3 galhos, apliquei pasta cicatrizante..."
            value={detalhes}
            onChangeText={setDetalhes}
            multiline
          />

          <Text style={styles.label}>Recursos Utilizados</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Tesoura, pasta cicatrizante, 50g de adubo."
            value={recursosUtilizados}
            onChangeText={setRecursosUtilizados}
          />

          <Text style={styles.label}>Observações para o Futuro</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Verificar brotação em 2 semanas."
            value={observacaoFutura}
            onChangeText={setObservacaoFutura}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.buttonClose]} onPress={onClose}>
              <Text style={styles.textStyle}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonComplete, isSubmitting && styles.buttonDisabled]}
              onPress={handleCompleteTask}
              disabled={isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.textStyle}>Concluir Tarefa</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
  },
  modalTitle: {
    marginBottom: 4,
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    marginBottom: 15,
    fontSize: 16,
    color: 'gray',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonComplete: {
    backgroundColor: '#28a745',
  },
  buttonClose: {
    backgroundColor: '#6c757d',
  },
  buttonDisabled: {
      backgroundColor: '#a3d9b1',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CompleteTaskModal;