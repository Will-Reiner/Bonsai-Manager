import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { plantaService } from '../../services/plantaService';
import { historicoService } from '../../services/historicoService';
import { Planta, RegistroHistorico } from '../../types';

// Componente para exibir um card de estatística
const StatCard = ({ label, value, loading }: { label: string; value: string | number; loading: boolean }) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    {loading ? <ActivityIndicator size="small" /> : <Text style={styles.statValue}>{value}</Text>}
  </View>
);

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  
  // Estados para as estatísticas
  const [plantCount, setPlantCount] = useState(0);
  const [activitiesThisYear, setActivitiesThisYear] = useState(0);
  const [adubacoesThisYear, setAdubacoesThisYear] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Buscar todas as plantas para obter a contagem
      const minhasPlantas = await plantaService.getMinhasPlantas();
      setPlantCount(minhasPlantas.length);

      // 2. Buscar o histórico de cada planta para calcular as outras estatísticas
      let allHistory: RegistroHistorico[] = [];
      for (const planta of minhasPlantas) {
        const history = await historicoService.getHistoricoPorPlanta(planta.id);
        allHistory.push(...history);
      }
      
      // 3. Filtrar e calcular as estatísticas do ano corrente
      const currentYear = new Date().getFullYear();
      const historyThisYear = allHistory.filter(
        (registro) => new Date(registro.dataRealizacao).getFullYear() === currentYear
      );
      
      setActivitiesThisYear(historyThisYear.length);
      
      const adubacoes = historyThisYear.filter(
        (registro) => registro.atividadeRealizada.toLowerCase().includes('aduba')
      ).length;
      setAdubacoesThisYear(adubacoes);

    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar as estatísticas.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
        </View>

        {/* Card de Informações do Usuário */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informações</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nome:</Text>
            <Text style={styles.infoValue}>{user?.nome}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
        </View>

        {/* Card de Estatísticas */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estatísticas</Text>
          <View style={styles.statsContainer}>
            <StatCard label="Plantas na Coleção" value={plantCount} loading={isLoading} />
            <StatCard label="Atividades (Ano)" value={activitiesThisYear} loading={isLoading} />
            <StatCard label="Adubações (Ano)" value={adubacoesThisYear} loading={isLoading} />
          </View>
        </View>

        {/* Card de Configurações */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Configurações</Text>
          <TouchableOpacity style={styles.buttonDisabled} disabled>
            <Text style={styles.buttonText}>Alterar Nome (Em breve)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonDisabled} disabled>
            <Text style={styles.buttonText}>Alterar Senha (Em breve)</Text>
          </TouchableOpacity>
        </View>
        
        {/* Botão de Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Sair (Logout)</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 15,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#6c757d',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 5,
  },
  buttonDisabled: {
    backgroundColor: '#e9ecef',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#6c757d',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen;