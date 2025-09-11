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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { especieService } from '../../services/especieService';
import { plantaService, UpdatePlantaDTO } from '../../services/plantaService';
import { Especie } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';

type EditPlantScreenRouteProp = RouteProp<RootStackParamList, 'EditPlant'>;

const EditPlantScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<EditPlantScreenRouteProp>();
  const { plantaId } = route.params;
  
  const [nome, setNome] = useState('');
  const [especieId, setEspecieId] = useState<string | undefined>();
  const [observacoes, setObservacoes] = useState('');
  
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plantaData, especiesData] = await Promise.all([
          plantaService.getPlantaById(plantaId),
          especieService.getAllEspecies(),
        ]);

        setNome(plantaData.nome || '');
        setEspecieId(plantaData.especieId);
        setObservacoes(plantaData.observacoes || '');
        setEspecies(especiesData);

      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar os dados para edição.');
        navigation.goBack();
      } finally {
        setIsFetchingData(false);
      }
    };
    fetchData();
  }, [plantaId, navigation]);

  const handleSubmit = async () => {
    if (!especieId) {
      Alert.alert('Campo Obrigatório', 'Por favor, selecione uma espécie.');
      return;
    }

    setIsLoading(true);
    const plantaData: UpdatePlantaDTO = {
      especieId,
      nome,
      observacoes,
    };

    try {
      await plantaService.updatePlanta(plantaId, plantaData);
      Alert.alert('Sucesso', 'Planta atualizada com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a planta.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingData) {
    return (
        <View style={styles.centered}>
            <ActivityIndicator size="large" />
            <Text>A carregar dados...</Text>
        </View>
    )
  }

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
          <Picker
            selectedValue={especieId}
            onValueChange={(itemValue) => setEspecieId(itemValue)}
          >
            {especies.map((especie) => (
              <Picker.Item
                key={especie.id}
                label={`${especie.nomeComum || especie.nomeCientifico} (${especie.nomeCientifico})`}
                value={especie.id}
              />
            ))}
          </Picker>
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
          <Text style={styles.buttonText}>Salvar Alterações</Text>
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        backgroundColor: '#007bff',
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#a0c7e4',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default EditPlantScreen;