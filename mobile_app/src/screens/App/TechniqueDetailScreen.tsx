import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { atividadeService } from '../../services/atividadeService';
import { atividadeFerramentaSugeridaService } from '../../services/atividadeFerramentaSugeridaService';
import { atividadeRecursoSugeridoService } from '../../services/atividadeRecursoSugeridoService';
import { Atividade, AtividadeFerramentaSugerida, AtividadeRecursoSugerido } from '../../types';
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
  const [ferramentas, setFerramentas] = useState<AtividadeFerramentaSugerida[]>([]);
  const [recursos, setRecursos] = useState<AtividadeRecursoSugerido[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [atividadeData, ferramentasData, recursosData] = await Promise.all([
          atividadeService.getAtividadeById(atividadeId),
          atividadeFerramentaSugeridaService.getByAtividade(atividadeId).catch(() => []),
          atividadeRecursoSugeridoService.getByAtividade(atividadeId).catch(() => []),
        ]);
        setAtividade(atividadeData);
        setFerramentas(ferramentasData);
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
      <DetailSection title="Descrição" content={atividade.descricao} />
      <DetailSection title="Objetivos" content={atividade.objetivos} />
      <DetailSection title="Preparação" content={atividade.preparacao} />
      <DetailSection title="Execução Passo a Passo" content={atividade.execucao} />
      <DetailSection title="Cuidados Pós-Procedimento" content={atividade.cuidadosPosProcedimento} />

      {ferramentas.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ferramentas Necessárias</Text>
          {ferramentas.map((item) => (
            <View key={item.ferramentaId} style={styles.listItem}>
              <Text style={styles.listItemName}>{item.ferramenta?.nome}</Text>
              {item.ferramenta?.descricao ? (
                <Text style={styles.listItemDesc}>{item.ferramenta.descricao}</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {recursos.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recursos Sugeridos</Text>
          {recursos.map((item) => (
            <View key={item.tipoRecursoId} style={styles.listItem}>
              <Text style={styles.listItemName}>{item.tipoRecurso?.nome}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.bottomSpacer} />
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
  listItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  listItemDesc: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginTop: 2,
  },
  bottomSpacer: {
    height: theme.spacing.lg,
  },
});

export default TechniqueDetailScreen;
