import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { atividadeService } from '../../services/atividadeService';
// O serviço de recursos sugeridos será criado no futuro
// import { atividadeRecursoService } from '../../services/atividadeRecursoService'; 
import { Atividade, TipoRecurso } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { theme } from '../../constants/theme';

type TechniqueDetailRouteProp = RouteProp<RootStackParamList, 'TechniqueDetail'>;

const DetailSection = ({ title, content }: { title: string, content?: string | null }) => {
  if (!content) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardContent}>{content}</Text>
    </View>
  );
};

const TechniqueDetailScreen = () => {
  const route = useRoute<TechniqueDetailRouteProp>();
  const { atividadeId } = route.params;

  const [atividade, setAtividade] = useState<Atividade | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const atividadeData = await atividadeService.getAtividadeById(atividadeId);
        setAtividade(atividadeData);
        // No futuro, aqui também buscaríamos os recursos e ferramentas sugeridos
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
      <DetailSection title="Descrição" content={atividade.descricao} />
      <DetailSection title="Objetivos" content={atividade.objetivos} />
      <DetailSection title="Preparação" content={atividade.preparacao} />
      <DetailSection title="Execução Passo a Passo" content={atividade.execucao} />
      <DetailSection title="Cuidados Pós-Procedimento" content={atividade.cuidadosPosProcedimento} />
    </ScrollView>
  );
};

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
  header: { 
    backgroundColor: theme.colors.card, 
    padding: theme.spacing.lg, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.lightGray 
  },
  mainTitle: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: theme.colors.text 
  },
  card: { 
    backgroundColor: theme.colors.card, 
    padding: theme.spacing.lg, 
    marginHorizontal: theme.spacing.md, 
    marginTop: theme.spacing.md, 
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: theme.colors.text, 
    marginBottom: theme.spacing.sm 
  },
  cardContent: { 
    fontSize: 16, 
    color: theme.colors.text, 
    lineHeight: 24 
  },
});

export default TechniqueDetailScreen;