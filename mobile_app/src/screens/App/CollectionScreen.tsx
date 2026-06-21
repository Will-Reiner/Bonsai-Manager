import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { plantaService } from '../../services/plantaService';
import { agendaService } from '../../services/agendaService';
import { Planta, Agenda } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { theme } from '../../constants/theme';
import { usePreferencias } from '../../context/PreferenciasContext';
import { isOverdue } from '../../utils/dateHelpers';
import PlantCollectionCard from '../../components/PlantCollectionCard';
import PlantFilterModal, { FilterChoice } from '../../components/PlantFilterModal';

type CollectionNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const KNOWN_TYPES = ['CONIFERA', 'ARVORE', 'CADUCIFOLIA', 'ARBUSTO'];

const isToday = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const CollectionScreen = () => {
  const navigation = useNavigation<CollectionNavigationProp>();
  const { preferencias } = usePreferencias();
  const usaIdentificador = preferencias.usa_identificador === 'true';
  const usaNome = preferencias.usa_nome_planta === 'true';

  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Busca e filtros
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [typeFilter, setTypeFilter] = useState('TODAS');
  const [taskFilter, setTaskFilter] = useState('ALL');
  const [speciesFilter, setSpeciesFilter] = useState('ALL');

  const filtersActive = typeFilter !== 'TODAS' || taskFilter !== 'ALL' || speciesFilter !== 'ALL';

  const carregarDados = useCallback(async () => {
    try {
      setError(null);
      const [plantasData, agendaData] = await Promise.all([
        plantaService.getMinhasPlantas(),
        agendaService.getMinhaAgenda(),
      ]);
      setPlantas(plantasData);
      setAgendas(agendaData);
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

  const handlePlantPress = (planta: Planta) => {
    navigation.navigate('PlantDetail', { plantaId: planta.id });
  };

  const toggleSearch = () => {
    setSearchVisible(prev => {
      if (prev) setSearchQuery('');
      return !prev;
    });
  };

  // Pendências por planta (hoje + atrasadas)
  const pendingMap = useMemo(() => {
    const map: Record<string, { today: number; overdue: number }> = {};
    agendas.forEach(a => {
      if (a.status !== 'PENDENTE') return;
      const overdue = isOverdue(a.dataAgendada);
      const today = !overdue && isToday(a.dataAgendada);
      if (!overdue && !today) return;
      if (!map[a.plantaId]) map[a.plantaId] = { today: 0, overdue: 0 };
      if (overdue) map[a.plantaId].overdue++;
      else map[a.plantaId].today++;
    });
    return map;
  }, [agendas]);

  // Opções de espécie para o filtro
  const speciesOptions = useMemo<FilterChoice[]>(() => {
    const m = new Map<string, string>();
    plantas.forEach(p => {
      if (p.especieId && !m.has(p.especieId)) {
        m.set(p.especieId, p.especie?.nomeComum || p.especie?.nomeCientifico || 'Espécie');
      }
    });
    return [{ key: 'ALL', label: 'Todas' }, ...Array.from(m, ([key, label]) => ({ key, label }))];
  }, [plantas]);

  // Aplicação de busca + filtros
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return plantas.filter(p => {
      // Busca por nome ou ID da plaquinha
      if (q) {
        const nome = (p.nome || '').toLowerCase();
        const id = (p.identificador || '').toLowerCase();
        if (!nome.includes(q) && !id.includes(q)) return false;
      }
      // Tipo de planta
      if (typeFilter !== 'TODAS') {
        const t = p.especie?.tipoDePlanta || '';
        if (typeFilter === 'OUTRAS') {
          if (KNOWN_TYPES.includes(t)) return false;
        } else if (t !== typeFilter) {
          return false;
        }
      }
      // Espécie
      if (speciesFilter !== 'ALL' && p.especieId !== speciesFilter) return false;
      // Tarefas
      if (taskFilter !== 'ALL') {
        const c = pendingMap[p.id];
        const today = c?.today || 0;
        const overdue = c?.overdue || 0;
        if (taskFilter === 'today' && today === 0) return false;
        if (taskFilter === 'overdue' && overdue === 0) return false;
        if (taskFilter === 'pending' && today + overdue === 0) return false;
      }
      return true;
    });
  }, [plantas, searchQuery, typeFilter, speciesFilter, taskFilter, pendingMap]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.infoText}>A carregar a sua coleção...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header: título + busca + filtro */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minha Coleção</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={toggleSearch} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name={searchVisible ? 'close' : 'magnify'}
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="filter-variant" size={24} color={theme.colors.primary} />
            {filtersActive && <View style={styles.headerDot} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Barra de busca (toggle) */}
      {searchVisible && (
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.subtext} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome ou ID da plaquinha..."
            placeholderTextColor={theme.colors.subtext}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.subtext} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {plantas.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="leaf-off" size={64} color={theme.colors.lightGray} />
          <Text style={styles.emptyText}>A sua coleção está vazia.</Text>
          <Text style={styles.emptySubtext}>Toque em '+' para adicionar a sua primeira planta!</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {filtered.length === 0 ? (
            <View style={styles.centeredSmall}>
              <Text style={styles.infoText}>Nenhuma planta encontrada.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {filtered.map(p => {
                const c = pendingMap[p.id];
                const pendingCount = (c?.today || 0) + (c?.overdue || 0);
                return (
                  <PlantCollectionCard
                    key={p.id}
                    planta={p}
                    usaIdentificador={usaIdentificador}
                    usaNome={usaNome}
                    pendingCount={pendingCount}
                    onPress={() => handlePlantPress(p)}
                  />
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      <PlantFilterModal
        isVisible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        typeFilter={typeFilter}
        taskFilter={taskFilter}
        speciesFilter={speciesFilter}
        speciesOptions={speciesOptions}
        onApply={(type, task, species) => {
          setTypeFilter(type);
          setTaskFilter(task);
          setSpeciesFilter(species);
        }}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.urgent,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    height: 44,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
  },
  scrollContent: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
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
});

export default CollectionScreen;
