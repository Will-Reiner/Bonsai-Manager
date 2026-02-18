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
import { Especie, ModoAquisicao, Planta } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { theme } from '../../constants/theme';

type EditPlantScreenRouteProp = RouteProp<RootStackParamList, 'EditPlant'>;

const EditPlantScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<EditPlantScreenRouteProp>();
  const { plantaId } = route.params;
  
  // Estados do formulário alinhados com a nova estrutura
  const [nome, setNome] = useState('');
  const [especieId, setEspecieId] = useState<string | undefined>();
  const [modoAquisicao, setModoAquisicao] = useState<ModoAquisicao | null | undefined>();
  const [visao, setVisao] = useState('');
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

        // Popula o formulário com os dados da planta
        setNome(plantaData.nome || '');
        setEspecieId(plantaData.especieId);
        setModoAquisicao(plantaData.modoAquisicao);
        setVisao(plantaData.visao || '');
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
      modoAquisicao,
      visao,
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
                label={especie.nomeComum || especie.nomeCientifico || 'Sem nome'}
                value={especie.id}
              />
            ))}
          </Picker>
      </View>
      
      <Text style={styles.label}>Como foi Adquirido</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={modoAquisicao}
          onValueChange={(itemValue) => setModoAquisicao(itemValue)}
        >
          <Picker.Item label="Não especificado" value={undefined} />
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
          <Text style={styles.buttonText}>Salvar Alterações</Text>
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        backgroundColor: theme.colors.primary,
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

export default EditPlantScreen;