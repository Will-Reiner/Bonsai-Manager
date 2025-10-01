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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { agendaService } from '../../services/agendaService';
import { Agenda } from '../../types';
import AgendaListItem from '../../components/AgendaListItem';
import { RootStackParamList } from '../../navigation/AppNavigator';

type AgendaScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const AgendaScreen = () => {
  const navigation = useNavigation<AgendaScreenNavigationProp>();
  const [agendamentos, setAgendamentos] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarAgenda = useCallback(async () => {
    try {
      setError(null);
      const data = await agendaService.getMinhaAgenda();
      setAgendamentos(data);
    } catch (err) {
      setError('Não foi possível carregar a sua agenda.');
      console.error(err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      carregarAgenda().finally(() => setIsLoading(false));
    }, [carregarAgenda])
  );
  
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await carregarAgenda();
    setIsRefreshing(false);
  }, [carregarAgenda]);

  const forceUpdate = () => {
      setIsLoading(true);
      carregarAgenda().finally(() => setIsLoading(false));
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.infoText}>A carregar a sua agenda...</Text>
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

    if (agendamentos.length === 0) {
        return (
            <View style={styles.centered}>
                <Text style={styles.emptyText}>A sua agenda está vazia.</Text>
                <Text style={styles.emptySubtext}>Quando agendar um cuidado, ele aparecerá aqui!</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={agendamentos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <AgendaListItem 
                  item={item} 
                  onUpdate={forceUpdate} 
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
        <Text style={styles.headerTitle}>Minha Agenda</Text>
        <TouchableOpacity onPress={() => { console.log("Botão de adicionar agendamento pressionado") }} style={styles.addButton}>
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
        paddingVertical: 10,
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

export default AgendaScreen;