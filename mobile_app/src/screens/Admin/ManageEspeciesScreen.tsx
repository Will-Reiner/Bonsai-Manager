import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { especieService } from '../../services/especieService';
import { Especie } from '../../types';

// React.memo impede que este componente renderize novamente sem necessidade.
const AddEspecieForm = React.memo(({ onEspecieAdded }: { onEspecieAdded: () => void }) => {
  const [nomeCientifico, setNomeCientifico] = useState('');
  const [nomeComum, setNomeComum] = useState('');
  const [informacoesGerais, setInformacoesGerais] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddEspecie = async () => {
    if (!nomeCientifico.trim()) {
      Alert.alert('Erro', 'O nome científico é obrigatório.');
      return;
    }
    setIsSubmitting(true);
    try {
      await especieService.createEspecie({
        nomeCientifico,
        nomeComum,
        informacoesGerais,
      });
      Alert.alert('Sucesso', 'Nova espécie adicionada.');
      // Limpa os campos e chama a função do componente pai para atualizar a lista
      setNomeCientifico('');
      setNomeComum('');
      setInformacoesGerais('');
      onEspecieAdded();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar a espécie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Adicionar Nova Espécie</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome Científico (ex: Malpighia emarginata)"
        value={nomeCientifico}
        onChangeText={setNomeCientifico}
      />
      <TextInput
        style={styles.input}
        placeholder="Nome Comum (ex: Acerola)"
        value={nomeComum}
        onChangeText={setNomeComum}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Informações Gerais (opcional)"
        value={informacoesGerais}
        onChangeText={setInformacoesGerais}
        multiline
      />
      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleAddEspecie}
        disabled={isSubmitting}
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Adicionar</Text>}
      </TouchableOpacity>
    </View>
  );
});


const ManageEspeciesScreen = () => {
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEspecies = useCallback(async () => {
    try {
      const data = await especieService.getAllEspecies();
      setEspecies(data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as espécies.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEspecies();
    }, [fetchEspecies])
  );

  if (isLoading) {
    return <ActivityIndicator style={{ marginTop: 20 }} size="large" />;
  }

  return (
    <FlatList
      style={styles.container}
      data={especies}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.listItem}>
          <Text style={styles.listItemTitle}>{item.nomeComum || item.nomeCientifico}</Text>
          <Text style={styles.listItemSubtitle}>{item.nomeCientifico}</Text>
        </View>
      )}
      ListHeaderComponent={<AddEspecieForm onEspecieAdded={fetchEspecies} />}
      keyboardShouldPersistTaps="handled" // Ajuda a manter o teclado ativo
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
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 12,
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
        fontStyle: 'italic',
    },
});

export default ManageEspeciesScreen;