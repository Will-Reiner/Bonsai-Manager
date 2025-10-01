import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { recursoService, CreateTipoRecursoDTO } from '../../services/recursoService';
import { TipoRecurso } from '../../types';

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
        backgroundColor: '#f5f5f5',
    },
    formContainer: {
        padding: 15,
        backgroundColor: '#fff',
    },
    formTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    button: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#a0c7e4',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    listHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        padding: 15,
        backgroundColor: '#f5f5f5',
        borderTopWidth: 1,
        borderTopColor: '#ddd'
    },
    listItem: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    listItemTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    // O estilo que estava em falta, agora adicionado
    emptyText: {
      textAlign: 'center',
      marginTop: 20,
      fontSize: 16,
      color: '#666'
    }
});

export default ManageTiposRecursoScreen;