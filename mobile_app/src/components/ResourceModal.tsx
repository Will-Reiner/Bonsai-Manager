import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Recurso, TipoRecurso, UnidadeMedida } from '../types';
import { recursoService, CreateRecursoDTO, UpdateRecursoDTO } from '../services/recursoService';
import { theme } from '../constants/theme';

interface ResourceModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: () => void;
  recursoToEdit: Recurso | null;
}

const ResourceModal: React.FC<ResourceModalProps> = ({ isVisible, onClose, onSave, recursoToEdit }) => {
  const [tipoRecursoId, setTipoRecursoId] = useState<string | undefined>();
  const [quantidade, setQuantidade] = useState('');
  const [unidadeMedida, setUnidadeMedida] = useState<UnidadeMedida | undefined>();
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
      setUnidadeMedida(recursoToEdit.unidadeMedida || undefined);
      setObservacoes(recursoToEdit.observacoes || '');
    } else {
      setTipoRecursoId(undefined);
      setQuantidade('');
      setUnidadeMedida(undefined);
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
        const data: UpdateRecursoDTO = { tipoRecursoId, quantidadeDisponivel: quantidadeNum, unidadeMedida: unidadeMedida || undefined, observacoes: observacoes || undefined };
        await recursoService.updateRecurso(recursoToEdit.id, data);
        Alert.alert('Sucesso', 'Recurso atualizado!');
      } else {
        const data: CreateRecursoDTO = { tipoRecursoId, quantidadeDisponivel: quantidadeNum, unidadeMedida: unidadeMedida || undefined, observacoes: observacoes || undefined };
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
            <View style={styles.pickerContainer}>
              <Picker selectedValue={unidadeMedida} onValueChange={(itemValue) => setUnidadeMedida(itemValue)}>
                <Picker.Item label="Selecione uma unidade..." value={undefined} />
                <Picker.Item label="Unidade" value="UNIDADE" />
                <Picker.Item label="Quilograma (kg)" value="KG" />
                <Picker.Item label="Grama (g)" value="G" />
                <Picker.Item label="Litro (L)" value="L" />
                <Picker.Item label="Mililitro (mL)" value="ML" />
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
    centeredView: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0,0,0,0.5)' 
    },
    modalView: { 
        margin: theme.spacing.lg, 
        backgroundColor: theme.colors.card, 
        borderRadius: 20, 
        padding: theme.spacing.xl, 
        width: '90%', 
        maxHeight: '80%' 
    },
    modalTitle: { 
        marginBottom: theme.spacing.md, 
        textAlign: 'center', 
        fontSize: 20, 
        fontWeight: 'bold',
        color: theme.colors.text
    },
    label: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: theme.colors.text, 
        marginBottom: 8 
    },
    input: { 
        backgroundColor: theme.colors.background, 
        borderRadius: 8, 
        paddingHorizontal: theme.spacing.md, 
        height: 50, 
        fontSize: 16, 
        marginBottom: theme.spacing.md, 
        borderWidth: 1, 
        borderColor: theme.colors.lightGray,
        color: theme.colors.text
    },
    textArea: { 
        height: 100, 
        textAlignVertical: 'top', 
        paddingTop: theme.spacing.md 
    },
    pickerContainer: { 
        backgroundColor: theme.colors.background, 
        borderRadius: 8, 
        borderWidth: 1, 
        borderColor: theme.colors.lightGray, 
        marginBottom: theme.spacing.md, 
        justifyContent: 'center' 
    },
    buttonContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginTop: theme.spacing.sm 
    },
    button: { 
        borderRadius: 10, 
        padding: theme.spacing.sm, 
        elevation: 2, 
        flex: 1, 
        marginHorizontal: 5 
    },
    buttonSave: { 
        backgroundColor: theme.colors.primary 
    },
    buttonClose: { 
        backgroundColor: theme.colors.textSecondary 
    },
    buttonDisabled: { 
        backgroundColor: theme.colors.lightGray 
    },
    textStyle: { 
        color: 'white', 
        fontWeight: 'bold', 
        textAlign: 'center' 
    },
});
export default ResourceModal;