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
import { Especie, ModoAquisicao } from '../../types';
import { theme } from '../../constants/theme';

const AddPlantScreen = () => {
  const navigation = useNavigation();
  
  // Estados do formulário alinhados com o novo DTO
  const [nome, setNome] = useState('');
  const [especieId, setEspecieId] = useState<string | undefined>();
  const [modoAquisicao, setModoAquisicao] = useState<ModoAquisicao | undefined>();
  const [visao, setVisao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  // Estados de controlo
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingEspecies, setIsFetchingEspecies] = useState(true);

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
      nome: nome || undefined,
      modoAquisicao: modoAquisicao || undefined,
      visao: visao || undefined,
      observacoes: observacoes || undefined,
      // dataAquisicao pode ser adicionado aqui com um DatePicker no futuro
    };

    try {
      await plantaService.createPlanta(plantaData);
      Alert.alert('Sucesso', 'Planta adicionada à sua coleção!');
      navigation.goBack();
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
                label={especie.nomeComum || especie.nomeCientifico}
                value={especie.id}
              />
            ))}
          </Picker>
        )}
      </View>

      <Text style={styles.label}>Como foi Adquirido</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={modoAquisicao}
          onValueChange={(itemValue) => setModoAquisicao(itemValue)}
        >
          <Picker.Item label="Selecione o modo..." value={undefined} />
          <Picker.Item label="Semente" value="SEMENTE" />
          <Picker.Item label="Estaca" value="ESTACA" />
          <Picker.Item label="Alporquia" value="ALPORQUIA" />
          <Picker.Item label="Yamadori" value="YAMADORI" />
          <Picker.Item label="Compra" value="COMPRA" />
        </Picker>
      </View>
      
      <Text style={styles.label}>Visão de Futuro</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Descreva como imagina esta planta no futuro"
        value={visao}
        onChangeText={setVisao}
        multiline
      />
      
      <Text style={styles.label}>Observações Gerais</Text>
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
        backgroundColor: theme.colors.background,
    },
    contentContainer: {
        padding: theme.spacing.lg,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    input: {
        backgroundColor: theme.colors.card,
        borderRadius: 8,
        paddingHorizontal: theme.spacing.md,
        height: 50,
        fontSize: 16,
        marginBottom: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.lightGray,
        color: theme.colors.text,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: theme.spacing.md,
    },
    pickerContainer: {
        backgroundColor: theme.colors.card,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.lightGray,
        marginBottom: theme.spacing.lg,
        justifyContent: 'center',
    },
    button: {
        backgroundColor: theme.colors.success,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
    },
    buttonDisabled: {
        backgroundColor: theme.colors.lightGray,
    },
    buttonText: {
        color: theme.colors.card,
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default AddPlantScreen;