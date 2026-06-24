import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { atividadeService, CreateAtividadeDTO } from '../../services/atividadeService';
import { Atividade } from '../../types';
import { theme } from '../../constants/theme';
import { LabeledInput } from '../../components/FormField';

/**
 * Formulário reutilizável de atividade. `initial` ativa o modo de edição
 * (botões "Salvar" e "Excluir"); ausente, modo de criação.
 */
const NAO_ESVAZIAR = 'Já tinha conteúdo — não pode ficar vazio.';

const AtividadeForm = ({ initial, onDone }: { initial?: Atividade; onDone: () => void }) => {
  const isEdit = !!initial;

  // No modo edição, um campo que já tinha conteúdo não pode ser esvaziado.
  const avisoEsvaziado = (valor: string, valorInicial?: string | null) =>
    isEdit && !!(valorInicial ?? '').trim() && !valor.trim() ? NAO_ESVAZIAR : undefined;

  const [nome, setNome] = useState(initial?.nome ?? '');
  const [descricao, setDescricao] = useState(initial?.descricao ?? '');
  const [objetivos, setObjetivos] = useState(initial?.objetivos ?? '');
  const [preparacao, setPreparacao] = useState(initial?.preparacao ?? '');
  const [execucao, setExecucao] = useState(initial?.execucao ?? '');
  const [cuidadosPosProcedimento, setCuidadosPosProcedimento] = useState(initial?.cuidadosPosProcedimento ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearForm = () => {
    setNome('');
    setDescricao('');
    setObjetivos('');
    setPreparacao('');
    setExecucao('');
    setCuidadosPosProcedimento('');
  };

  const handleSubmit = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'O nome da atividade é obrigatório.');
      return;
    }

    // Bloqueio: campos que já tinham conteúdo não podem ser salvos vazios
    if (isEdit) {
      const campos: [string, string, string | null | undefined][] = [
        ['Descrição Breve', descricao, initial?.descricao],
        ['Objetivos', objetivos, initial?.objetivos],
        ['Preparação', preparacao, initial?.preparacao],
        ['Execução', execucao, initial?.execucao],
        ['Cuidados Pós-Procedimento', cuidadosPosProcedimento, initial?.cuidadosPosProcedimento],
      ];
      const esvaziados = campos
        .filter(([, valor, valorInicial]) => !!(valorInicial ?? '').trim() && !valor.trim())
        .map(([label]) => label);
      if (esvaziados.length > 0) {
        Alert.alert(
          'Não é possível salvar',
          `Os campos a seguir já tinham conteúdo e não podem ficar vazios:\n\n• ${esvaziados.join('\n• ')}\n\nPreencha-os novamente para salvar.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const data: CreateAtividadeDTO = {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        objetivos: objetivos.trim() || undefined,
        preparacao: preparacao.trim() || undefined,
        execucao: execucao.trim() || undefined,
        cuidadosPosProcedimento: cuidadosPosProcedimento.trim() || undefined,
      };
      if (isEdit && initial) {
        await atividadeService.updateAtividade(initial.id, data);
        Alert.alert('Sucesso', 'Atividade atualizada.');
      } else {
        await atividadeService.createAtividade(data);
        Alert.alert('Sucesso', 'Nova atividade adicionada.');
        clearForm();
      }
      onDone();
    } catch (error) {
      Alert.alert('Erro', isEdit ? 'Não foi possível atualizar a atividade.' : 'Não foi possível adicionar a atividade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!initial) return;
    Alert.alert(
      'Excluir atividade',
      `Tem certeza que deseja excluir "${initial.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await atividadeService.deleteAtividade(initial.id);
              Alert.alert('Sucesso', 'Atividade excluída.');
              onDone();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir. Verifique se não há agendas/guias usando esta atividade.');
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
      {!isEdit && <Text style={styles.formTitle}>Adicionar Nova Atividade</Text>}
      <LabeledInput label="Nome da Atividade" required placeholder="Ex: Poda de manutenção" value={nome} onChangeText={setNome} />
      <LabeledInput label="Descrição Breve" placeholder="Resumo da atividade..." value={descricao} onChangeText={setDescricao} multiline warning={avisoEsvaziado(descricao, initial?.descricao)} />
      <LabeledInput label="Objetivos" placeholder="O que se pretende alcançar..." value={objetivos} onChangeText={setObjetivos} multiline warning={avisoEsvaziado(objetivos, initial?.objetivos)} />
      <LabeledInput label="Preparação" placeholder="O que fazer antes de começar..." value={preparacao} onChangeText={setPreparacao} multiline warning={avisoEsvaziado(preparacao, initial?.preparacao)} />
      <LabeledInput label="Execução (Passo a Passo)" placeholder="Como executar a atividade..." value={execucao} onChangeText={setExecucao} multiline warning={avisoEsvaziado(execucao, initial?.execucao)} />
      <LabeledInput label="Cuidados Pós-Procedimento" placeholder="Cuidados após a atividade..." value={cuidadosPosProcedimento} onChangeText={setCuidadosPosProcedimento} multiline warning={avisoEsvaziado(cuidadosPosProcedimento, initial?.cuidadosPosProcedimento)} />

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isEdit ? 'Salvar Alterações' : 'Adicionar Atividade'}</Text>}
      </TouchableOpacity>

      {isEdit && (
        <TouchableOpacity
          style={[styles.deleteButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleDelete}
          disabled={isSubmitting}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Excluir Atividade</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// A tela principal que exibe a lista e o formulário
const ManageAtividadesScreen = () => {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<Atividade | null>(null);

  const fetchAtividades = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await atividadeService.getAllAtividades();
      setAtividades(data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as atividades.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAtividades();
    }, [fetchAtividades])
  );

  const onEditDone = () => {
    setEditing(null);
    fetchAtividades();
  };

  return (
    <>
      <FlatList
        style={styles.container}
        data={atividades}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.listItem} onPress={() => setEditing(item)} activeOpacity={0.6}>
            <View style={styles.listItemRow}>
              <Text style={styles.listItemTitle}>{item.nome}</Text>
              <View style={{ flex: 1 }} />
              <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.colors.subtext} />
            </View>
            {item.descricao && <Text style={styles.listItemSubtitle}>{item.descricao}</Text>}
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <>
            <AtividadeForm onDone={fetchAtividades} />
            <Text style={styles.listHeader}>Atividades Existentes</Text>
          </>
        }
        ListEmptyComponent={!isLoading ? <Text style={styles.emptyText}>Nenhuma atividade cadastrada.</Text> : null}
        keyboardShouldPersistTaps="handled"
      />

      <Modal visible={!!editing} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Atividade</Text>
              <TouchableOpacity onPress={() => setEditing(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              {editing && <AtividadeForm key={editing.id} initial={editing} onDone={onEditDone} />}
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
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.lightGray,
    },
    listItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    listItemTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text,
    },
    listItemSubtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 4,
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


export default ManageAtividadesScreen;
