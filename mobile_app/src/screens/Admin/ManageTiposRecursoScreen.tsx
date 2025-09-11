import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { recursoService } from '../../services/recursoService';
import { TipoRecurso } from '../../types';

const ManageTiposRecursoScreen = () => {
  const [tiposRecurso, setTiposRecurso] = useState<TipoRecurso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para o formulário de adição
  const [nome, setNome] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTiposRecurso = useCallback(async () => {
    try {
      // Usamos a função getAllTiposRecurso do nosso recursoService
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

  const handleAddTipoRecurso = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'O nome do tipo de recurso é obrigatório.');
      return;
    }
    setIsSubmitting(true);
    try {
      await recursoService.createTipoRecurso({ nome }); 
      Alert.alert('Sucesso', 'Novo tipo de recurso adicionado.');
      
      setNome('');
      fetchTiposRecurso(); // Recarrega a lista

    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar o tipo de recurso.');
    } finally {
      setIsSubmitting(false);
    }
  };
  

  if (isLoading) {
    return <ActivityIndicator style={{ marginTop: 20 }} size="large" />;
  }

  return (
    <View style={styles.container}>
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
            onPress={handleAddTipoRecurso}
            disabled={isSubmitting}
        >
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Adicionar</Text>}
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={tiposRecurso}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.listItemTitle}>{item.nome}</Text>
          </View>
        )}
        ListHeaderComponent={<Text style={styles.listHeader}>Tipos de Recurso Existentes</Text>}
      />
    </View>
  );
};

// Estilos semelhantes aos das outras telas de gestão
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    formContainer: {
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    formTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        backgroundColor: '#fff',
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
});

export default ManageTiposRecursoScreen;