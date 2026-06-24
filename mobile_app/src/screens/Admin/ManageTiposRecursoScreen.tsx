import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { recursoService, CreateTipoRecursoDTO } from '../../services/recursoService';
import { TipoRecurso } from '../../types';
import { theme } from '../../constants/theme';
import { LabeledInput } from '../../components/FormField';

/**
 * Formulário reutilizável de tipo de recurso. `initial` ativa o modo de edição
 * (botões "Salvar" e "Excluir"); ausente, modo de criação.
 */
const TipoRecursoForm = ({ initial, onDone }: { initial?: TipoRecurso; onDone: () => void }) => {
  const isEdit = !!initial;
  const [nome, setNome] = useState(initial?.nome ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'O nome do tipo de recurso é obrigatório.');
      return;
    }
    setIsSubmitting(true);
    try {
      const data: CreateTipoRecursoDTO = { nome: nome.trim() };
      if (isEdit && initial) {
        await recursoService.updateTipoRecurso(initial.id, data);
        Alert.alert('Sucesso', 'Tipo de recurso atualizado.');
      } else {
        await recursoService.createTipoRecurso(data);
        Alert.alert('Sucesso', 'Novo tipo de recurso adicionado.');
        setNome('');
      }
      onDone();
    } catch (error) {
      Alert.alert('Erro', isEdit ? 'Não foi possível atualizar o tipo de recurso.' : 'Não foi possível adicionar o tipo de recurso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!initial) return;
    Alert.alert(
      'Excluir tipo de recurso',
      `Tem certeza que deseja excluir "${initial.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await recursoService.deleteTipoRecurso(initial.id);
              Alert.alert('Sucesso', 'Tipo de recurso excluído.');
              onDone();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir. Verifique se não há recursos usando este tipo.');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={isEdit ? undefined : styles.formContainer}>
      {!isEdit && <Text style={styles.formTitle}>Adicionar Novo Tipo de Recurso</Text>}
      <LabeledInput
        label="Nome do Tipo de Recurso"
        required
        placeholder="Ex: Substrato, Vaso, Adubo"
        value={nome}
        onChangeText={setNome}
        warning={isEdit && !!(initial?.nome ?? '').trim() && !nome.trim() ? 'Já tinha conteúdo — não pode ficar vazio.' : undefined}
      />
      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isEdit ? 'Salvar Alterações' : 'Adicionar'}</Text>}
      </TouchableOpacity>

      {isEdit && (
        <TouchableOpacity
          style={[styles.deleteButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleDelete}
          disabled={isSubmitting}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Excluir Tipo de Recurso</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};


// A tela principal que exibe a lista e o formulário
const ManageTiposRecursoScreen = () => {
  const [tiposRecurso, setTiposRecurso] = useState<TipoRecurso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<TipoRecurso | null>(null);

  const fetchTiposRecurso = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await recursoService.getAllTiposRecurso();
      setTiposRecurso(data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os tipos de recurso.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTiposRecurso();
    }, [fetchTiposRecurso])
  );

  const onEditDone = () => {
    setEditing(null);
    fetchTiposRecurso();
  };

  return (
    <>
      <FlatList
        style={styles.container}
        data={tiposRecurso}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.listItem} onPress={() => setEditing(item)} activeOpacity={0.6}>
            <Text style={styles.listItemTitle}>{item.nome}</Text>
            <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.colors.subtext} />
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <>
            <TipoRecursoForm onDone={fetchTiposRecurso} />
            <Text style={styles.listHeader}>Tipos de Recurso Existentes</Text>
          </>
        }
        ListEmptyComponent={!isLoading ? <Text style={styles.emptyText}>Nenhum tipo de recurso cadastrado.</Text> : null}
        keyboardShouldPersistTaps="handled"
      />

      <Modal visible={!!editing} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Tipo de Recurso</Text>
              <TouchableOpacity onPress={() => setEditing(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              {editing && <TipoRecursoForm key={editing.id} initial={editing} onDone={onEditDone} />}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    formContainer: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.card,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: theme.spacing.md,
        color: theme.colors.text,
    },
    button: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: 8,
        alignItems: 'center',
    },
    deleteButton: {
        backgroundColor: theme.colors.danger,
        padding: theme.spacing.md,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        marginTop: theme.spacing.sm,
    },
    buttonDisabled: {
        backgroundColor: theme.colors.lightGray,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    listHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background,
        borderTopWidth: 1,
        borderTopColor: theme.colors.lightGray,
        color: theme.colors.text,
    },
    listItem: {
        backgroundColor: theme.colors.card,
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.lightGray,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    listItemTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: theme.spacing.lg,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
      paddingTop: theme.spacing.md,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.lightGray,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    modalScroll: {
      padding: theme.spacing.md,
    },
});

export default ManageTiposRecursoScreen;
