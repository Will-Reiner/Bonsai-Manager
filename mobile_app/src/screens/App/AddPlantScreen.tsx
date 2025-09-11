import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { especieService } from '../../services/especieService';
import { plantaService, CreatePlantaDTO } from '../../services/plantaService';
import { Especie } from '../../types';

const AddPlantScreen = () => {
  const navigation = useNavigation();
  
  // Estados do formulário
  const [nome, setNome] = useState('');
  const [especieId, setEspecieId] = useState<string | undefined>();
  const [observacoes, setObservacoes] = useState('');
  
  // Estados de controlo
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingEspecies, setIsFetchingEspecies] = useState(true);

  // Busca as espécies disponíveis quando a tela é montada
  useEffect(() => {
    const fetchEspecies = async () => {
      try {
        const data = await especieService.getAllEspecies();
        setEspecies(data);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar a lista de espécies.');
      } finally {
        setIsFetchingEspecies(false);
      }
    };
    fetchEspecies();
  }, []);

  const handleSubmit = async () => {
    if (!especieId) {
      Alert.alert('Campo Obrigatório', 'Por favor, selecione uma espécie.');
      return;
    }

    setIsLoading(true);
    const plantaData: CreatePlantaDTO = {
      especieId,
      nome: nome || undefined, // Envia undefined se o campo estiver vazio
      observacoes: observacoes || undefined,
      // TODO: Adicionar campos de data aqui (ex: dataAquisicao)
    };

    try {
      await plantaService.createPlanta(plantaData);
      Alert.alert('Sucesso', 'Planta adicionada à sua coleção!');
      navigation.goBack(); // Volta para a tela da coleção
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar a planta.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.label}>Nome (Apelido)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Meu Junípero"
        value={nome}
        onChangeText={setNome}
      />

      <Text style={styles.label}>Espécie *</Text>
      <View style={styles.pickerContainer}>
        {isFetchingEspecies ? (
          <ActivityIndicator />
        ) : (
          <Picker
            selectedValue={especieId}
            onValueChange={(itemValue) => setEspecieId(itemValue)}
          >
            <Picker.Item label="Selecione uma espécie..." value={undefined} />
            {especies.map((especie) => (
              <Picker.Item
                key={especie.id}
                label={`${especie.nomeComum} (${especie.nomeCientifico})`}
                value={especie.id}
              />
            ))}
          </Picker>
        )}
      </View>
      
      <Text style={styles.label}>Observações</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Detalhes sobre a aquisição, estado inicial, etc."
        value={observacoes}
        onChangeText={setObservacoes}
        multiline
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Adicionar Planta</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    contentContainer: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 15,
        height: 50,
        fontSize: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
        paddingTop: 15,
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 20,
        justifyContent: 'center',
    },
    button: {
        backgroundColor: '#28a745',
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#a3d9b1',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default AddPlantScreen;