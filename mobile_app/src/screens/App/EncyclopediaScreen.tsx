import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { especieService } from '../../services/especieService';
import { atividadeService } from '../../services/atividadeService';
import { Especie, Atividade } from '../../types';
import ProfileAvatar from '../../components/ProfileAvatar';
import FilterChips, { FilterOption } from '../../components/FilterChips';
import Carousel from '../../components/Carousel';

type EncyclopediaNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ReadingItem {
  id: string;
  type: 'especie' | 'tecnica';
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  readTime: number;
}

const topicFilters: FilterOption[] = [
  { key: 'TODOS', label: 'Todos' },
  { key: 'especie', label: 'Espécies' },
  { key: 'tecnica', label: 'Técnicas' },
];

/**
 * Estima tempo de leitura em minutos com base no tamanho dos textos.
 */
const estimateReadTime = (texts: (string | null | undefined)[]): number => {
  const total = texts.reduce((acc, t) => acc + (t?.length || 0), 0);
  const words = total / 5; // ~5 chars por palavra
  const minutes = Math.max(1, Math.round(words / 200)); // ~200 wpm
  return minutes;
};

const EncyclopediaScreen = () => {
  const navigation = useNavigation<EncyclopediaNavigationProp>();
  const { user } = useAuth();
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('TODOS');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [esp, atv] = await Promise.all([
          especieService.getAllEspecies(),
          atividadeService.getAllAtividades(),
        ]);
        setEspecies(esp);
        setAtividades(atv);
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar os dados.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const readingItems: ReadingItem[] = useMemo(() => {
    const items: ReadingItem[] = [];

    especies.forEach(e => {
      items.push({
        id: e.id,
        type: 'especie',
        title: e.nomeComum || e.nomeCientifico || 'Espécie',
        subtitle: e.nomeCientifico || e.familia || '',
        icon: 'leaf',
        readTime: estimateReadTime([
          e.folhas, e.tronco, e.flores, e.frutos, e.raizes,
          e.luminosidade, e.rega, e.substratoIdeal, e.adubacao,
          e.clima, e.problemasComuns, e.pros, e.contras, e.observacoes,
        ]),
      });
    });

    atividades.forEach(a => {
      items.push({
        id: a.id,
        type: 'tecnica',
        title: a.nome,
        subtitle: a.descricao?.substring(0, 80) || '',
        icon: 'school',
        readTime: estimateReadTime([a.descricao, a.objetivos, a.preparacao, a.execucao, a.cuidadosPosProcedimento]),
      });
    });

    return items;
  }, [especies, atividades]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'TODOS') return readingItems;
    return readingItems.filter(i => i.type === activeFilter);
  }, [readingItems, activeFilter]);

  // Top 5 para carousel
  const carouselItems = useMemo(() => readingItems.slice(0, 5), [readingItems]);

  const handlePress = (item: ReadingItem) => {
    if (item.type === 'especie') {
      navigation.navigate('SpeciesDetail', { especieId: item.id, title: item.title });
    } else {
      navigation.navigate('TechniqueDetail', { atividadeId: item.id, title: item.title });
    }
  };

  const renderItem = ({ item }: { item: ReadingItem }) => (
    <TouchableOpacity style={styles.readingCard} onPress={() => handlePress(item)} activeOpacity={0.7}>
      <View style={styles.readingIconContainer}>
        <MaterialCommunityIcons name={item.icon} size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.readingContent}>
        <Text style={styles.readingTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.readingSubtitle} numberOfLines={1}>{item.subtitle}</Text>
      </View>
      <Text style={styles.readTime}>{item.readTime} min</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const ListHeader = () => (
    <>
      {/* Carousel de leituras recomendadas */}
      {carouselItems.length > 0 && (
        <View style={styles.carouselSection}>
          <Text style={styles.carouselLabel}>Leituras Recomendadas</Text>
          <Carousel
            data={carouselItems}
            keyExtractor={item => item.id}
            autoPlayInterval={4000}
            renderItem={(item) => (
              <TouchableOpacity style={styles.carouselCard} onPress={() => handlePress(item)} activeOpacity={0.8}>
                <View style={styles.carouselIconBg}>
                  <MaterialCommunityIcons name={item.icon} size={32} color={theme.colors.primary} />
                </View>
                <Text style={styles.carouselTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.carouselSubtitle} numberOfLines={2}>{item.subtitle}</Text>
                <Text style={styles.carouselReadTime}>{item.readTime} min de leitura</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Filtros */}
      <FilterChips filters={topicFilters} activeKey={activeFilter} onSelect={setActiveFilter} />
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Enciclopédia</Text>
        <ProfileAvatar
          size={36}
          imageUrl={user?.fotoPerfilUrl}
          onPress={() => navigation.navigate('Settings')}
        />
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={item => `${item.type}-${item.id}`}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum item encontrado.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselSection: {
    marginTop: theme.spacing.md,
  },
  carouselLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  carouselCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    height: 160,
    justifyContent: 'center',
    ...theme.shadows.soft,
  },
  carouselIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  carouselSubtitle: {
    fontSize: 13,
    color: theme.colors.subtext,
    marginTop: 2,
  },
  carouselReadTime: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: theme.spacing.xs,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  readingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.shadows.soft,
  },
  readingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  readingContent: {
    flex: 1,
  },
  readingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  readingSubtitle: {
    fontSize: 12,
    color: theme.colors.subtext,
    fontStyle: 'italic',
    marginTop: 2,
  },
  readTime: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.subtext,
  },
});

export default EncyclopediaScreen;
