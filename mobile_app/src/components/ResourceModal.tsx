import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Recurso, TipoRecurso, RecursoStatus } from '../types';
import { recursoService, CreateRecursoDTO, UpdateRecursoDTO } from '../services/recursoService';

interface ResourceModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: () => void;
  recursoToEdit: Recurso | null;
}

const ResourceModal: React.FC<ResourceModalProps> = ({ isVisible, onClose, onSave, recursoToEdit }) => {
  const [tipoRecursoId, setTipoRecursoId] = useState<string | undefined>();
  const [quantidade, setQuantidade] = useState('');
  const [unidadeMedida, setUnidadeMedida] = useState('');
  const [status, setStatus] = useState<RecursoStatus>('DISPONIVEL');
  const [observacoes, setObservacoes] = useState('');

  const [tiposRecurso, setTiposRecurso] = useState<TipoRecurso[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTipos, setIsLoadingTipos] = useState(true);

  useEffect(() => {
    if (isVisible) {
      setIsLoadingTipos(true);
      const fetchTiposRecurso = async () => {
        try {
          const data = await recursoService.getAllTiposRecurso();
          setTiposRecurso(data);
        } catch (error) {
          Alert.alert('Erro', 'Não foi possível carregar os tipos de recurso.');
        } finally {
          setIsLoadingTipos(false);
        }
      };
      fetchTiposRecurso();
    }
  }, [isVisible]);

  useEffect(() => {
    if (recursoToEdit) {
      setTipoRecursoId(recursoToEdit.tipoRecursoId);
      setQuantidade(recursoToEdit.quantidadeDisponivel.toString());
      setUnidadeMedida(recursoToEdit.unidadeMedida || '');
      setStatus(recursoToEdit.status);
      setObservacoes(recursoToEdit.observacoes || '');
    } else {
      setTipoRecursoId(undefined);
      setQuantidade('');
      setUnidadeMedida('');
      setStatus('DISPONIVEL');
      setObservacoes('');
    }
  }, [recursoToEdit]);

  const handleSave = async () => {
    if (!tipoRecursoId || !quantidade) {
      Alert.alert('Erro', 'Tipo de Recurso e Quantidade são obrigatórios.');
      return;
    }
    const quantidadeNum = parseFloat(quantidade);
    if (isNaN(quantidadeNum) || quantidadeNum < 0) {
      Alert.alert('Erro', 'A quantidade deve ser um número válido.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (recursoToEdit) {
        const data: UpdateRecursoDTO = { tipoRecursoId, quantidadeDisponivel: quantidadeNum, unidadeMedida: unidadeMedida || undefined, status, observacoes: observacoes || undefined };
        await recursoService.updateRecurso(recursoToEdit.id, data);
        Alert.alert('Sucesso', 'Recurso atualizado!');
      } else {
        const data: CreateRecursoDTO = { tipoRecursoId, quantidadeDisponivel: quantidadeNum, unidadeMedida: unidadeMedida || undefined, status, observacoes: observacoes || undefined };
        await recursoService.createRecurso(data);
        Alert.alert('Sucesso', 'Recurso adicionado ao inventário!');
      }
      onSave();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o recurso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ScrollView>
            <Text style={styles.modalTitle}>{recursoToEdit ? 'Editar Recurso' : 'Adicionar Recurso'}</Text>

            <Text style={styles.label}>Tipo de Recurso *</Text>
            {isLoadingTipos ? <ActivityIndicator/> : (
              <View style={styles.pickerContainer}>
                <Picker selectedValue={tipoRecursoId} onValueChange={(itemValue) => setTipoRecursoId(itemValue)} enabled={!recursoToEdit}>
                  <Picker.Item label="Selecione um tipo..." value={undefined} />
                  {tiposRecurso.map(tipo => <Picker.Item key={tipo.id} label={tipo.nome} value={tipo.id} />)}
                </Picker>
              </View>
            )}

            <Text style={styles.label}>Quantidade *</Text>
            <TextInput style={styles.input} value={quantidade} onChangeText={setQuantidade} keyboardType="numeric" placeholder="Ex: 5" />
            
            <Text style={styles.label}>Unidade de Medida</Text>
            <TextInput style={styles.input} value={unidadeMedida} onChangeText={setUnidadeMedida} placeholder="Ex: kg, L, un" />

            <Text style={styles.label}>Status</Text>
             <View style={styles.pickerContainer}>
              <Picker selectedValue={status} onValueChange={(itemValue) => setStatus(itemValue)}>
                <Picker.Item label="Disponível" value="DISPONIVEL" />
                <Picker.Item label="Em Falta" value="EM_FALTA" />
                <Picker.Item label="Encomendado" value="ENCOMENDADO" />
              </Picker>
            </View>

            <Text style={styles.label}>Observações</Text>
            <TextInput style={[styles.input, styles.textArea]} value={observacoes} onChangeText={setObservacoes} multiline placeholder="Ex: Marca, data de compra..."/>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.buttonClose]} onPress={onClose}>
                <Text style={styles.textStyle}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonSave, isSubmitting && styles.buttonDisabled]} onPress={handleSave} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.textStyle}>Salvar</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { margin: 20, backgroundColor: 'white', borderRadius: 20, padding: 25, width: '90%', maxHeight: '80%' },
    modalTitle: { marginBottom: 15, textAlign: 'center', fontSize: 20, fontWeight: 'bold' },
    label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    input: { backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 15, height: 50, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
    textArea: { height: 100, textAlignVertical: 'top', paddingTop: 15 },
    pickerContainer: { backgroundColor: '#f5f5f5', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 15, justifyContent: 'center' },
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    button: { borderRadius: 10, padding: 12, elevation: 2, flex: 1, marginHorizontal: 5 },
    buttonSave: { backgroundColor: '#007bff' },
    buttonClose: { backgroundColor: '#6c757d' },
    buttonDisabled: { backgroundColor: '#a0c7e4' },
    textStyle: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
});
export default ResourceModal;