import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { atividadeService } from '../../services/atividadeService';
import { atividadeRecursoService } from '../../services/atividadeRecursoService';
import { Atividade, TipoRecurso } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';

type TechniqueDetailRouteProp = RouteProp<RootStackParamList, 'TechniqueDetail'>;

const TechniqueDetailScreen = () => {
  const route = useRoute<TechniqueDetailRouteProp>();
  const { atividadeId } = route.params;

  const [atividade, setAtividade] = useState<Atividade | null>(null);
  const [recursos, setRecursos] = useState<TipoRecurso[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [atividadeData, recursosData] = await Promise.all([
          atividadeService.getAtividadeById(atividadeId),
          atividadeRecursoService.getRecursosPorAtividade(atividadeId),
        ]);
        setAtividade(atividadeData);
        setRecursos(recursosData);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar os detalhes da técnica.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [atividadeId]);

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (!atividade) {
    return <View style={styles.centered}><Text>Técnica não encontrada.</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>{atividade.nome}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Descrição</Text>
        <Text style={styles.cardContent}>{atividade.descricao || 'Nenhuma descrição disponível.'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recursos Necessários</Text>
        {recursos.length > 0 ? (
          recursos.map(recurso => (
            <Text key={recurso.id} style={styles.recursoItem}>• {recurso.nome}</Text>
          ))
        ) : (
          <Text style={styles.cardContent}>Nenhum recurso específico associado.</Text>
        )}
      </View>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  mainTitle: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  card: { backgroundColor: '#fff', padding: 20, marginHorizontal: 15, marginTop: 15, borderRadius: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#444', marginBottom: 10 },
  cardContent: { fontSize: 16, color: '#333', lineHeight: 24 },
  recursoItem: { fontSize: 16, color: '#333', marginBottom: 5 },
});
export default TechniqueDetailScreen;