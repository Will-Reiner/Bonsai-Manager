import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { atividadeService } from '../../services/atividadeService';
import { Atividade } from '../../types';

const ManageAtividadesScreen = () => {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para o formulário de adição
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAtividades = useCallback(async () => {
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

  const handleAddAtividade = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'O nome da atividade é obrigatório.');
      return;
    }
    setIsSubmitting(true);
    try {
      await atividadeService.createAtividade({
        nome,
        descricao,
      });
      Alert.alert('Sucesso', 'Nova atividade adicionada.');
      // Limpa os campos e recarrega a lista
      setNome('');
      setDescricao('');
      fetchAtividades();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar a atividade.');
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
        <Text style={styles.formTitle}>Adicionar Nova Atividade</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome da Atividade (ex: Poda de Raízes)"
          value={nome}
          onChangeText={setNome}
        />
        <TextInput
          style={styles.input}
          placeholder="Descrição (opcional)"
          value={descricao}
          onChangeText={setDescricao}
        />
        <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleAddAtividade}
            disabled={isSubmitting}
        >
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Adicionar</Text>}
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={atividades}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.listItemTitle}>{item.nome}</Text>
            {item.descricao && <Text style={styles.listItemSubtitle}>{item.descricao}</Text>}
          </View>
        )}
        ListHeaderComponent={<Text style={styles.listHeader}>Atividades Existentes</Text>}
      />
    </View>
  );
};

// Os estilos podem ser reutilizados da tela de espécies
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
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    listItemTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    listItemSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
});


export default ManageAtividadesScreen;