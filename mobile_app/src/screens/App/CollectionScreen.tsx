import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { plantaService } from '../../services/plantaService';
import { Planta } from '../../types';
import PlantListItem from '../../components/PlantListItem';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { theme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type CollectionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type SortOption = 'nome' | 'data_asc' | 'data_desc';

const CollectionScreen = () => {
  const navigation = useNavigation<CollectionScreenNavigationProp>();
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('data_desc');

  const carregarPlantas = useCallback(async () => {
    try {
      setError(null);
      const data = await plantaService.getMinhasPlantas();
      setPlantas(data);
    } catch (err) {
      setError('Não foi possível carregar a sua coleção.');
      console.error(err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      carregarPlantas().finally(() => setIsLoading(false));
    }, [carregarPlantas])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await carregarPlantas();
    setIsRefreshing(false);
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...plantas];

    // Filtrar por texto
    if (searchText.trim()) {
      const term = searchText.toLowerCase();
      result = result.filter(p => {
        const nome = (p.nome || '').toLowerCase();
        const nomeComum = (p.especie?.nomeComum || '').toLowerCase();
        const nomeCientifico = (p.especie?.nomeCientifico || '').toLowerCase();
        return nome.includes(term) || nomeComum.includes(term) || nomeCientifico.includes(term);
      });
    }

    // Ordenar
    result.sort((a, b) => {
      if (sortBy === 'nome') {
        const nomeA = (a.nome || a.especie?.nomeComum || '').toLowerCase();
        const nomeB = (b.nome || b.especie?.nomeComum || '').toLowerCase();
        return nomeA.localeCompare(nomeB);
      }
      if (sortBy === 'data_asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      // data_desc (padrão)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [plantas, searchText, sortBy]);

  const handlePlantPress = (planta: Planta) => {
    navigation.navigate('PlantDetail', { plantaId: planta.id });
  };

  const cycleSortOption = () => {
    setSortBy(prev => {
      if (prev === 'data_desc') return 'nome';
      if (prev === 'nome') return 'data_asc';
      return 'data_desc';
    });
  };

  const sortLabel = sortBy === 'nome' ? 'A-Z' : sortBy === 'data_asc' ? 'Antiga' : 'Recente';

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.infoText}>A carregar a sua coleção...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={handleRefresh}>
              <Text style={styles.buttonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (plantas.length === 0) {
        return (
            <View style={styles.centered}>
                <MaterialCommunityIcons name="leaf-off" size={64} color={theme.colors.lightGray} />
                <Text style={styles.emptyText}>A sua coleção está vazia.</Text>
                <Text style={styles.emptySubtext}>Toque em '+' para adicionar a sua primeira planta!</Text>
            </View>
        );
    }

    return (
      <>
        <View style={styles.filterRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar planta..."
            placeholderTextColor={theme.colors.subtext}
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity style={styles.sortButton} onPress={cycleSortOption}>
            <MaterialCommunityIcons name="sort" size={18} color={theme.colors.card} />
            <Text style={styles.sortButtonText}>{sortLabel}</Text>
          </TouchableOpacity>
        </View>
        <FlatList
            data={filteredAndSorted}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <PlantListItem
                planta={item}
                onPress={() => handlePlantPress(item)}
                />
            )}
            contentContainerStyle={styles.list}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={styles.infoText}>Nenhum resultado encontrado.</Text>
              </View>
            }
        />
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Minha Coleção</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddPlant')} style={styles.addButton}>
            <MaterialCommunityIcons name="plus" size={28} color={theme.colors.card} />
        </TouchableOpacity>
      </View>

      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.large,
    },
    infoText: {
        marginTop: theme.spacing.medium,
        fontSize: 16,
        color: theme.colors.subtext,
    },
    list: {
        padding: theme.spacing.medium,
    },
    errorText: {
        fontSize: 16,
        color: theme.colors.danger,
        marginBottom: theme.spacing.medium,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.subtext,
        marginTop: theme.spacing.medium,
    },
    emptySubtext: {
        fontSize: 14,
        color: theme.colors.subtext,
        marginTop: theme.spacing.small,
    },
    button: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    buttonText: {
        color: theme.colors.card,
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.medium,
        paddingVertical: theme.spacing.small,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.lightGray,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    addButton: {
        backgroundColor: theme.colors.primary,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.medium,
        paddingVertical: theme.spacing.small,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        backgroundColor: theme.colors.card,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 15,
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: theme.colors.lightGray,
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4,
    },
    sortButtonText: {
        color: theme.colors.card,
        fontWeight: 'bold',
        fontSize: 13,
    },
});

export default CollectionScreen;
