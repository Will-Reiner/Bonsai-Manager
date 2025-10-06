import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { atividadeService, CreateAtividadeDTO } from '../../services/atividadeService';
import { Atividade } from '../../types';
import { theme } from '../../constants/theme';

// O formulário para adicionar a atividade
const AddAtividadeForm = React.memo(({ onAtividadeAdded }: { onAtividadeAdded: () => void }) => {
  // Estados para todos os campos da atividade
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [objetivos, setObjetivos] = useState('');
  const [preparacao, setPreparacao] = useState('');
  const [execucao, setExecucao] = useState('');
  const [cuidadosPosProcedimento, setCuidadosPosProcedimento] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearForm = () => {
    setNome('');
    setDescricao('');
    setObjetivos('');
    setPreparacao('');
    setExecucao('');
    setCuidadosPosProcedimento('');
  };

  const handleAddAtividade = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'O nome da atividade é obrigatório.');
      return;
    }
    setIsSubmitting(true);
    try {
      const data: CreateAtividadeDTO = {
        nome,
        descricao: descricao || undefined,
        objetivos: objetivos || undefined,
        preparacao: preparacao || undefined,
        execucao: execucao || undefined,
        cuidadosPosProcedimento: cuidadosPosProcedimento || undefined,
      };
      await atividadeService.createAtividade(data);
      Alert.alert('Sucesso', 'Nova atividade adicionada.');
      clearForm();
      onAtividadeAdded();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar a atividade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Adicionar Nova Atividade</Text>
      <TextInput style={styles.input} placeholder="Nome da Atividade *" value={nome} onChangeText={setNome} />
      <TextInput style={[styles.input, styles.textArea]} placeholder="Descrição Breve" value={descricao} onChangeText={setDescricao} multiline />
      <TextInput style={[styles.input, styles.textArea]} placeholder="Objetivos" value={objetivos} onChangeText={setObjetivos} multiline />
      <TextInput style={[styles.input, styles.textArea]} placeholder="Preparação" value={preparacao} onChangeText={setPreparacao} multiline />
      <TextInput style={[styles.input, styles.textArea]} placeholder="Execução (Passo a Passo)" value={execucao} onChangeText={setExecucao} multiline />
      <TextInput style={[styles.input, styles.textArea]} placeholder="Cuidados Pós-Procedimento" value={cuidadosPosProcedimento} onChangeText={setCuidadosPosProcedimento} multiline />
      
      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleAddAtividade}
        disabled={isSubmitting}
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Adicionar Atividade</Text>}
      </TouchableOpacity>
    </View>
  );
});

// A tela principal que exibe a lista e o formulário
const ManageAtividadesScreen = () => {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <FlatList
      style={styles.container}
      data={atividades}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.listItem}>
          <Text style={styles.listItemTitle}>{item.nome}</Text>
          {item.descricao && <Text style={styles.listItemSubtitle}>{item.descricao}</Text>}
        </View>
      )}
      ListHeaderComponent={
        <>
          <AddAtividadeForm onAtividadeAdded={fetchAtividades} />
          <Text style={styles.listHeader}>Atividades Existentes</Text>
        </>
      }
      ListEmptyComponent={!isLoading ? <Text style={styles.emptyText}>Nenhuma atividade cadastrada.</Text> : null}
      keyboardShouldPersistTaps="handled"
    />
  );
};

// Estilos reutilizados da tela de ManageEspeciesScreen
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
    input: {
        borderWidth: 1,
        borderColor: theme.colors.lightGray,
        borderRadius: 8,
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.card,
        fontSize: 16,
        color: theme.colors.text,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: 8,
        alignItems: 'center',
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
    }
});


export default ManageAtividadesScreen;