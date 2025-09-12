import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { especieService } from '../../services/especieService';
import { Especie } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';

type SpeciesDetailRouteProp = RouteProp<RootStackParamList, 'SpeciesDetail'>;

const SpeciesDetailScreen = () => {
  const route = useRoute<SpeciesDetailRouteProp>();
  const { especieId } = route.params;

  const [especie, setEspecie] = useState<Especie | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEspecie = async () => {
      try {
        const data = await especieService.getEspecieById(especieId);
        setEspecie(data);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar os detalhes da espécie.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEspecie();
  }, [especieId]);

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (!especie) {
    return <View style={styles.centered}><Text>Espécie não encontrada.</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>{especie.nomeComum}</Text>
        <Text style={styles.subtitle}>{especie.nomeCientifico}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informações Gerais</Text>
        <Text style={styles.cardContent}>{especie.informacoesGerais || 'Nenhuma informação geral disponível.'}</Text>
      </View>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  mainTitle: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 18, fontStyle: 'italic', color: '#666', marginTop: 4 },
  card: { backgroundColor: '#fff', padding: 20, margin: 15, borderRadius: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#444', marginBottom: 10 },
  cardContent: { fontSize: 16, color: '#333', lineHeight: 24 },
});
export default SpeciesDetailScreen;