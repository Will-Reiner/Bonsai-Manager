import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { plantaService } from '../../services/plantaService';
import { Planta } from '../../types';
import PlantListItem from '../../components/PlantListItem';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { theme } from '../../constants/theme'; // Importando nosso tema
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Importando ícones

type CollectionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CollectionScreen = () => {
  const navigation = useNavigation<CollectionScreenNavigationProp>();
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }

  const handlePlantPress = (planta: Planta) => {
    navigation.navigate('PlantDetail', { plantaId: planta.id });
  };

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
        <FlatList
            data={plantas}
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
        />
    );
  }

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
});

export default CollectionScreen;