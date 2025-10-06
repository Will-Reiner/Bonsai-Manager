import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { recursoService, CreateTipoRecursoDTO } from '../../services/recursoService';
import { TipoRecurso } from '../../types';
import { theme } from '../../constants/theme';

// O formulário para adicionar o Tipo de Recurso
const AddTipoRecursoForm = React.memo(({ onTipoRecursoAdded }: { onTipoRecursoAdded: () => void }) => {
  const [nome, setNome] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'O nome do tipo de recurso é obrigatório.');
      return;
    }
    setIsSubmitting(true);
    try {
      const data: CreateTipoRecursoDTO = { nome };
      await recursoService.createTipoRecurso(data);
      Alert.alert('Sucesso', 'Novo tipo de recurso adicionado.');
      setNome('');
      onTipoRecursoAdded();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar o tipo de recurso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Adicionar Novo Tipo de Recurso</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome (ex: Substrato, Vaso, Adubo)"
        value={nome}
        onChangeText={setNome}
      />
      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleAdd}
        disabled={isSubmitting}
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Adicionar</Text>}
      </TouchableOpacity>
    </View>
  );
});


// A tela principal que exibe a lista e o formulário
const ManageTiposRecursoScreen = () => {
  const [tiposRecurso, setTiposRecurso] = useState<TipoRecurso[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <FlatList
      style={styles.container}
      data={tiposRecurso}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.listItem}>
          <Text style={styles.listItemTitle}>{item.nome}</Text>
        </View>
      )}
      ListHeaderComponent={
        <>
          <AddTipoRecursoForm onTipoRecursoAdded={fetchTiposRecurso} />
          <Text style={styles.listHeader}>Tipos de Recurso Existentes</Text>
        </>
      }
      ListEmptyComponent={!isLoading ? <Text style={styles.emptyText}>Nenhum tipo de recurso cadastrado.</Text> : null}
      keyboardShouldPersistTaps="handled"
    />
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
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.lightGray,
    },
    listItemTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text,
    },
    // O estilo que estava em falta, agora adicionado
    emptyText: {
      textAlign: 'center',
      marginTop: theme.spacing.lg,
      fontSize: 16,
      color: theme.colors.textSecondary,
    }
});

export default ManageTiposRecursoScreen;