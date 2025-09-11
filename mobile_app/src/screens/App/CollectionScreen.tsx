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

// Define o tipo do hook de navegação para ter autocomplete e segurança
type CollectionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const CollectionScreen = () => {
  const navigation = useNavigation<CollectionScreenNavigationProp>();
  const { logout } = useAuth();
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

  // useFocusEffect roda toda vez que a tela entra em foco.
  // Isso garante que a lista seja atualizada se o utilizador voltar de outra tela.
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
          <ActivityIndicator size="large" color="#007bff" />
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
            <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    infoText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666'
    },
    list: {
        padding: 10,
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        marginBottom: 20,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#555',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#777',
        marginTop: 8,
    },
    button: {
        backgroundColor: '#007bff',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    addButton: {
        backgroundColor: '#007bff',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 24,
        lineHeight: 30,
        fontWeight: 'bold',
    },
});

export default CollectionScreen;