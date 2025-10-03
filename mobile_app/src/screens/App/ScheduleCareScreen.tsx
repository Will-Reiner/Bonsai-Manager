import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform, // Import Platform para lidar com diferenças de SO
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { atividadeService } from '../../services/atividadeService';
import { agendaService, CreateAgendaDTO } from '../../services/agendaService';
import { Atividade } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { theme } from '../../constants/theme';

type ScheduleCareScreenRouteProp = RouteProp<RootStackParamList, 'ScheduleCare'>;

// Opções para os botões de data rápida
const quickDateOptions = [
  { label: '1 Semana', value: { unit: 'day', amount: 7 } },
  { label: '15 Dias', value: { unit: 'day', amount: 15 } },
  { label: '1 Mês', value: { unit: 'month', amount: 1 } },
  { label: '3 Meses', value: { unit: 'month', amount: 3 } },
  { label: '6 Meses', value: { unit: 'month', amount: 6 } },
  { label: '1 Ano', value: { unit: 'year', amount: 1 } },
];

const ScheduleCareScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<ScheduleCareScreenRouteProp>();
  const { plantaId } = route.params;

  // Estados do formulário
  const [atividadeId, setAtividadeId] = useState<string | undefined>();
  const [dataAgendada, setDataAgendada] = useState(new Date());
  const [observacoes, setObservacoes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Estados de controlo
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);

  useEffect(() => {
    const fetchAtividades = async () => {
      try {
        const atividadesData = await atividadeService.getAllAtividades();
        setAtividades(atividadesData);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar a lista de atividades.');
      } finally {
        setIsFetchingData(false);
      }
    };
    fetchAtividades();
  }, []);

  // Função para lidar com a mudança de data do DatePicker
  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // No iOS, o picker é um modal, então mantemos visível
    if (selectedDate) {
      setDataAgendada(selectedDate);
    }
  };

  // Função para os botões de seleção rápida
  const handleQuickDateSelect = (unit: 'day' | 'month' | 'year', amount: number) => {
    const newDate = new Date();
    if (unit === 'day') newDate.setDate(newDate.getDate() + amount);
    if (unit === 'month') newDate.setMonth(newDate.getMonth() + amount);
    if (unit === 'year') newDate.setFullYear(newDate.getFullYear() + amount);
    setDataAgendada(newDate);
  };

  const handleSubmit = async () => {
    if (!atividadeId) {
      Alert.alert('Campo Obrigatório', 'Por favor, selecione uma atividade.');
      return;
    }
    setIsLoading(true);
    const agendaData: CreateAgendaDTO = {
      plantaId,
      atividadeId,
      dataAgendada: dataAgendada.toISOString(),
      observacoes: observacoes || undefined,
    };
    try {
      await agendaService.createAgendamento(agendaData);
      Alert.alert('Sucesso', 'Atividade agendada com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar o agendamento.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingData) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.label}>Atividade *</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={atividadeId} onValueChange={(itemValue) => setAtividadeId(itemValue)}>
          <Picker.Item label="Selecione uma atividade..." value={undefined} />
          {atividades.map((atividade) => (
            <Picker.Item key={atividade.id} label={atividade.nome} value={atividade.id} />
          ))}
        </Picker>
      </View>
      
      <Text style={styles.label}>Agendar Para Daqui a</Text>
      <View style={styles.quickDateContainer}>
        {quickDateOptions.map(option => (
          <TouchableOpacity 
            key={option.label} 
            style={styles.quickDateButton} 
            onPress={() => handleQuickDateSelect(option.value.unit as any, option.value.amount)}
          >
            <Text style={styles.quickDateButtonText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Ou Escolha uma Data Específica</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
        <Text style={styles.datePickerButtonText}>{dataAgendada.toLocaleDateString('pt-BR')}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={dataAgendada}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      <Text style={styles.label}>Observações</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Notas sobre este agendamento..."
        value={observacoes}
        onChangeText={setObservacoes}
        multiline
      />

      <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleSubmit} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Agendar Tarefa</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

// Adicionar novos estilos e ajustar os existentes
const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: theme.colors.background 
    },
    centered: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: theme.colors.background
    },
    contentContainer: { 
        padding: theme.spacing.lg 
    },
    label: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: theme.colors.text, 
        marginBottom: theme.spacing.xs, 
        marginTop: theme.spacing.sm 
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
        color: theme.colors.text
    },
    textArea: { 
        height: 120, 
        textAlignVertical: 'top', 
        paddingTop: theme.spacing.md 
    },
    pickerContainer: { 
        backgroundColor: theme.colors.card, 
        borderRadius: 8, 
        borderWidth: 1, 
        borderColor: theme.colors.lightGray, 
        marginBottom: theme.spacing.sm, 
        justifyContent: 'center' 
    },
    
    // Novos estilos para a seleção de data
    quickDateContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.lg,
    },
    quickDateButton: {
        backgroundColor: theme.colors.lightGray,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: 20,
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.lightGray
    },
    quickDateButtonText: {
        color: theme.colors.text,
        fontSize: 14,
    },
    datePickerButton: {
      backgroundColor: theme.colors.card,
      borderRadius: 8,
      paddingHorizontal: theme.spacing.md,
      height: 50,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.lightGray,
      marginBottom: theme.spacing.sm,
    },
    datePickerButtonText: {
      fontSize: 16,
      color: theme.colors.text
    },

    button: { 
        backgroundColor: theme.colors.primary, 
        height: 50, 
        borderRadius: 8, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: theme.spacing.sm 
    },
    buttonDisabled: { 
        backgroundColor: theme.colors.lightGray 
    },
    buttonText: { 
        color: theme.colors.card, 
        fontSize: 18, 
        fontWeight: 'bold' 
    },
});

export default ScheduleCareScreen;