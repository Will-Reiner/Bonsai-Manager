import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Alert, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import { plantaService } from '../../services/plantaService';
import { agendaService } from '../../services/agendaService'; // Usaremos o serviço de agenda
import { Planta, Agenda } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';
import HistoryListItem from '../../components/HistoryListItem';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type PlantDetailScreenRouteProp = RouteProp<RootStackParamList, 'PlantDetail'>;
type PlantDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PlantDetail'>;

const PlantDetailScreen = () => {
  const route = useRoute<PlantDetailScreenRouteProp>();
  const navigation = useNavigation<PlantDetailNavigationProp>();
  const { plantaId } = route.params;

  const [planta, setPlanta] = useState<Planta | null>(null);
  const [agenda, setAgenda] = useState<Agenda[]>([]); // Armazena todos os agendamentos da planta
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    if (!plantaId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // 1. Busca os dados da planta
      const dataPlanta = await plantaService.getPlantaById(plantaId);
      setPlanta(dataPlanta);

      // 2. Busca TODA a agenda do usuário. No futuro, uma rota de API otimizada seria melhor.
      const todosAgendamentos = await agendaService.getMinhaAgenda();
      
      // 3. Filtra a agenda para mostrar apenas itens desta planta
      const agendaDaPlanta = todosAgendamentos.filter(item => item.plantaId === plantaId);
      setAgenda(agendaDaPlanta);

    } catch (err) {
      setError('Erro ao carregar os dados da planta.');
      Alert.alert('Erro', 'Não foi possível carregar os dados completos da planta.');
    } finally {
      setIsLoading(false);
    }
  }, [plantaId]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );
  
  // Usamos useMemo para filtrar o histórico apenas quando a agenda mudar.
  // Isso é mais eficiente do que filtrar a cada renderização.
  const historico = useMemo(() => {
    return agenda.filter(item => item.status === 'CONCLUIDO')
                 .sort((a, b) => new Date(b.dataConcluida!).getTime() - new Date(a.dataConcluida!).getTime());
  }, [agenda]);

  const handleDelete = () => { /* ... (código existente, sem alterações) ... */ };
  const handleEdit = () => navigation.navigate('EditPlant', { plantaId });
  const handleSchedule = () => navigation.navigate('ScheduleCare', { plantaId });

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (error || !planta) {
    return <View style={styles.centered}><Text style={styles.errorText}>{error || 'Planta não encontrada.'}</Text></View>;
  }

  const renderDetailRow = (label: string, value?: string | null | Date) => {
    if (!value) return null;
    const displayValue = value instanceof Date ? value.toLocaleDateString('pt-BR') : value;
    return (
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{displayValue}</Text>
      </View>
    );
  };

  const ListHeader = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>{planta.nome || planta.especie.nomeComum}</Text>
        <Text style={styles.subtitle}>{planta.especie.nomeCientifico}</Text>
      </View>
      <View style={styles.card}>
        {renderDetailRow('Modo de Aquisição', planta.modoAquisicao)}
        {renderDetailRow('Data de Aquisição', planta.dataAquisicao ? new Date(planta.dataAquisicao) : null)}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notas e Visão de Futuro</Text>
        {renderDetailRow('Visão', planta.visao)}
        {renderDetailRow('Observações', planta.observacoes)}
      </View>
    </>
  );
  
  const ListFooter = () => (
    <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.scheduleButton]} onPress={handleSchedule}>
            <Text style={styles.actionButtonText}>Agendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
            <Text style={styles.actionButtonText}>Apagar</Text>
        </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
        style={styles.container}
        data={historico}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <HistoryListItem item={item} />} // Passamos o item da agenda para o HistoryListItem
        ListHeaderComponent={
            <>
                <ListHeader />
                <View style={styles.historyHeader}>
                    <Text style={styles.cardTitle}>Histórico de Cuidados (Concluídos)</Text>
                </View>
            </>
        }
        ListFooterComponent={ListFooter}
        ListEmptyComponent={
            <View style={styles.centeredEmpty}>
                <Text>Nenhum registo de histórico para esta planta.</Text>
            </View>
        }
    />
  );
};


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    centeredEmpty: { padding: 20, alignItems: 'center' },
    header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    mainTitle: { fontSize: 28, fontWeight: 'bold', color: '#333' },
    subtitle: { fontSize: 18, fontStyle: 'italic', color: '#666', marginTop: 4 },
    card: { backgroundColor: '#fff', padding: 20, marginHorizontal: 15, marginTop: 15, borderRadius: 8 },
    historyHeader: { marginTop: 20, paddingHorizontal: 20, paddingBottom: 10 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#444' },
    detailRow: { marginBottom: 10 },
    detailLabel: { fontSize: 14, color: '#888', marginBottom: 4 },
    detailValue: { fontSize: 16, color: '#333' },
    errorText: { fontSize: 16, color: 'red' },
    actionsContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 20, marginTop: 10 },
    actionButton: { backgroundColor: '#007bff', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', flex: 1, marginHorizontal: 5 },
    scheduleButton: { backgroundColor: '#17a2b8' },
    deleteButton: { backgroundColor: '#dc3545' },
    actionButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default PlantDetailScreen;