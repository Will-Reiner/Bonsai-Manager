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
import { theme } from '../../constants/theme';

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
          <ActivityIndicator size="large" color={theme.colors.primary} />
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
        backgroundColor: theme.colors.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.large,
    },
    infoText: {
        marginTop: theme.spacing.small,
        fontSize: theme.typography.body.fontSize,
        color: theme.colors.subtext,
    },
    list: {
        paddingVertical: theme.spacing.small,
    },
    errorText: {
        fontSize: theme.typography.body.fontSize,
        color: theme.colors.danger,
        marginBottom: theme.spacing.large,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    emptySubtext: {
        fontSize: 14,
        color: theme.colors.subtext,
        marginTop: theme.spacing.small,
        textAlign: 'center',
    },
    button: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    buttonText: {
        color: theme.colors.card,
        fontSize: theme.typography.body.fontSize,
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
        fontSize: theme.typography.h2.fontSize,
        fontWeight: theme.typography.h2.fontWeight as any,
        color: theme.colors.text,
    },
    addButton: {
        backgroundColor: theme.colors.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: theme.colors.card,
        fontSize: 24,
        lineHeight: 30,
        fontWeight: 'bold',
    },
});

export default AgendaScreen;