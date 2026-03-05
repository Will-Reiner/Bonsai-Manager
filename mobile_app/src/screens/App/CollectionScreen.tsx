import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { plantaService } from '../../services/plantaService';
import { agendaService } from '../../services/agendaService';
import { Planta } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { resolveMediaUri } from '../../utils/resolveMediaUri';
import ProfileAvatar from '../../components/ProfileAvatar';
import SectionHeader from '../../components/SectionHeader';
import StatisticsCard from '../../components/StatisticsCard';
import FilterChips, { FilterOption } from '../../components/FilterChips';
import PlantGridItem from '../../components/PlantGridItem';
import Carousel from '../../components/Carousel';

type CollectionNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SCREEN_WIDTH = Dimensions.get('window').width;

const typeFilters: FilterOption[] = [
  { key: 'TODAS', label: 'Todas' },
  { key: 'CONIFERA', label: 'Coníferas' },
  { key: 'ARVORE', label: 'Árvores' },
  { key: 'CADUCIFOLIA', label: 'Decíduas' },
  { key: 'ARBUSTO', label: 'Arbustos' },
  { key: 'OUTRAS', label: 'Outras' },
];

const CollectionScreen = () => {
  const navigation = useNavigation<CollectionNavigationProp>();
  const { user } = useAuth();
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [concluidos, setConcluidos] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('TODAS');

  const carregarDados = useCallback(async () => {
    try {
      setError(null);
      const [plantasData, agendaData] = await Promise.all([
        plantaService.getMinhasPlantas(),
        agendaService.getMinhaAgenda(),
      ]);
      setPlantas(plantasData);
      setConcluidos(agendaData.filter(a => a.status === 'CONCLUIDO').length);
    } catch (err) {
      setError('Não foi possível carregar a sua coleção.');
      console.error(err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      carregarDados().finally(() => setIsLoading(false));
    }, [carregarDados])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await carregarDados();
    setIsRefreshing(false);
  };

  // Plantas recentes para o carousel (top 5 com foto de capa)
  const carouselPlantas = useMemo(() => {
    return plantas
      .filter(p => p.fotoCapaUrl)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [plantas]);

  // Espécies únicas
  const uniqueSpecies = useMemo(() => {
    const set = new Set(plantas.map(p => p.especieId));
    return set.size;
  }, [plantas]);

  // Plantas filtradas
  const filteredPlantas = useMemo(() => {
    if (activeFilter === 'TODAS') return plantas;
    if (activeFilter === 'OUTRAS') {
      const known = ['CONIFERA', 'ARVORE', 'CADUCIFOLIA', 'ARBUSTO'];
      return plantas.filter(p => !known.includes(p.especie?.tipoDePlanta || ''));
    }
    return plantas.filter(p => p.especie?.tipoDePlanta === activeFilter);
  }, [plantas, activeFilter]);

  const handlePlantPress = (planta: Planta) => {
    navigation.navigate('PlantDetail', { plantaId: planta.id });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.infoText}>A carregar a sua coleção...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const ListHeader = () => (
    <>
      {/* Carousel de favoritos / recentes */}
      {carouselPlantas.length > 0 && (
        <View style={styles.carouselSection}>
          <Carousel
            data={carouselPlantas}
            keyExtractor={(item) => item.id}
            renderItem={(item) => (
              <TouchableOpacity
                style={styles.carouselItem}
                onPress={() => handlePlantPress(item)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: resolveMediaUri(item.fotoCapaUrl!) }}
                  style={styles.carouselImage}
                  resizeMode="cover"
                />
                <View style={styles.carouselOverlay}>
                  <Text style={styles.carouselName}>{item.nome || item.especie?.nomeComum}</Text>
                  <Text style={styles.carouselSpecies}>{item.especie?.nomeCientifico || ''}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Estatísticas */}
      <View style={styles.statsSection}>
        <StatisticsCard
          stats={[
            { label: 'Plantas', value: plantas.length },
            { label: 'Espécies', value: uniqueSpecies },
            { label: 'Concluídos', value: concluidos },
          ]}
        />
      </View>

      {/* Filtros */}
      <FilterChips filters={typeFilters} activeKey={activeFilter} onSelect={setActiveFilter} />
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minha Coleção</Text>
        <ProfileAvatar
          size={36}
          imageUrl={user?.fotoPerfilUrl}
          onPress={() => navigation.navigate('Settings')}
        />
      </View>

      {plantas.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="leaf-off" size={64} color={theme.colors.lightGray} />
          <Text style={styles.emptyText}>A sua coleção está vazia.</Text>
          <Text style={styles.emptySubtext}>Toque em '+' para adicionar a sua primeira planta!</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPlantas}
          keyExtractor={item => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <PlantGridItem planta={item} onPress={() => handlePlantPress(item)} />
          )}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.gridRow}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centeredSmall}>
              <Text style={styles.infoText}>Nenhuma planta com este filtro.</Text>
            </View>
          }
        />
      )}
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
    padding: theme.spacing.lg,
  },
  centeredSmall: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  infoText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.subtext,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.danger,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: theme.borderRadius.xl,
  },
  retryText: {
    color: theme.colors.card,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.subtext,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginTop: theme.spacing.sm,
  },
  carouselSection: {
    marginTop: theme.spacing.md,
  },
  carouselItem: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    height: 180,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.lightGray,
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  carouselName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  carouselSpecies: {
    fontSize: 13,
    color: '#FFFFFFCC',
    fontStyle: 'italic',
  },
  statsSection: {
    marginTop: theme.spacing.md,
  },
  gridContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
});

export default CollectionScreen;
