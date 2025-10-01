import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { especieService } from '../../services/especieService';
import { Especie } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';

type SpeciesDetailRouteProp = RouteProp<RootStackParamList, 'SpeciesDetail'>;

// Componente auxiliar para não repetir código
const DetailSection = ({ title, content }: { title: string, content?: string | null }) => {
  if (!content) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardContent}>{content}</Text>
    </View>
  );
};

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
      
      <DetailSection title="Família" content={especie.familia} />
      <DetailSection title="Origem" content={especie.origem} />
      {/* A linha com 'informacoesGerais' foi REMOVIDA daqui */}
      <DetailSection title="Luminosidade" content={especie.luminosidade} />
      <DetailSection title="Rega" content={especie.rega} />
      <DetailSection title="Substrato Ideal" content={especie.substratoIdeal} />
      <DetailSection title="Adubação" content={especie.adubacao} />
      <DetailSection title="Prós" content={especie.pros} />
      <DetailSection title="Contras" content={especie.contras} />
      {/* Adicione outros DetailSection para os campos que desejar */}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  mainTitle: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 18, fontStyle: 'italic', color: '#666', marginTop: 4 },
  card: { backgroundColor: '#fff', padding: 20, marginHorizontal: 15, marginTop: 15, borderRadius: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#444', marginBottom: 10 },
  cardContent: { fontSize: 16, color: '#333', lineHeight: 24 },
});

export default SpeciesDetailScreen;