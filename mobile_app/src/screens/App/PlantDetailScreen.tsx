import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { plantaService } from '../../services/plantaService';
import { Planta } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator'; // Vamos criar este tipo no próximo passo

// Define o tipo dos parâmetros que esta tela espera receber
type PlantDetailScreenRouteProp = RouteProp<RootStackParamList, 'PlantDetail'>;

const PlantDetailScreen = () => {
  const route = useRoute<PlantDetailScreenRouteProp>();
  const { plantaId } = route.params;

  const [planta, setPlanta] = useState<Planta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregarDetalhesPlanta = async () => {
      if (!plantaId) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const data = await plantaService.getPlantaById(plantaId);
        setPlanta(data);
      } catch (err) {
        setError('Erro ao carregar os detalhes da planta.');
        Alert.alert('Erro', 'Não foi possível carregar os detalhes da planta.');
      } finally {
        setIsLoading(false);
      }
    };

    carregarDetalhesPlanta();
  }, [plantaId]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !planta) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Planta não encontrada.'}</Text>
      </View>
    );
  }

  // Função auxiliar para renderizar uma linha de detalhe
  const renderDetailRow = (label: string, value?: string | null | Date) => {
    if (!value) return null;

    const displayValue = value instanceof Date ? value.toLocaleDateString('pt-BR') : value;
    
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{displayValue}</Text>
        </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.mainTitle}>{planta.nome || planta.especie.nomeComum}</Text>
            <Text style={styles.subtitle}>{planta.especie.nomeCientifico}</Text>
        </View>

        <View style={styles.card}>
            {renderDetailRow('Status Atual', planta.statusAtual)}
            {renderDetailRow('Data de Aquisição', planta.dataAquisicao ? new Date(planta.dataAquisicao) : null)}
            {renderDetailRow('Próximo Transplante', planta.dataProximoTransplante ? new Date(planta.dataProximoTransplante) : null)}
        </View>
        
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Notas e Objetivos</Text>
            {renderDetailRow('Visão de Futuro', planta.visao)}
            {renderDetailRow('Objetivo do Ano', planta.objetivoAno)}
            {renderDetailRow('Observações', planta.observacoes)}
        </View>
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
    header: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 18,
        fontStyle: 'italic',
        color: '#666',
        marginTop: 4,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 20,
        margin: 15,
        marginBottom: 0,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#444',
    },
    detailRow: {
        marginBottom: 15,
    },
    detailLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16,
        color: '#333',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
    },
});


export default PlantDetailScreen;