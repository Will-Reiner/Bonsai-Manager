import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { Usuario } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';

// Componente reutilizado
const StatCard = ({ label, value, loading, onPress }: { label: string; value: string | number; loading: boolean, onPress?: () => void }) => (
  <TouchableOpacity style={styles.statCard} onPress={onPress} disabled={!onPress}>
    <Text style={styles.statValue}>{loading ? <ActivityIndicator size="small" /> : value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout } = useAuth();
  const [fullUser, setFullUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFullUserData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/auth/me');
      setFullUser(response.data);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os seus dados de perfil.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFullUserData();
    }, [fetchFullUserData])
  );

  const followers = fullUser?.seguidores?.map(f => f.seguidor) || [];
  const following = fullUser?.seguindo?.map(f => f.seguido) || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{user?.nomePublico || user?.nome}</Text>
          {/* ... (infoRow existente) ... */}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Conexões</Text>
          <View style={styles.statsContainer}>
            <StatCard label="Plantas" value={fullUser?.plantas?.length ?? 0} loading={isLoading} />
            <StatCard 
              label="Seguidores" 
              value={followers.length} 
              loading={isLoading} 
              onPress={() => navigation.navigate('UserList', { users: followers, title: 'Seguidores' })}
            />
            <StatCard 
              label="A Seguir" 
              value={following.length} 
              loading={isLoading}
              onPress={() => navigation.navigate('UserList', { users: following, title: 'A Seguir' })}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Sair (Logout)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// Estilos atualizados
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    headerContainer: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 28, fontWeight: 'bold' },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginHorizontal: 15, marginTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
    cardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    infoLabel: { fontSize: 16, color: '#6c757d' },
    infoValue: { fontSize: 16, fontWeight: '500' },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-around' },
    statCard: { alignItems: 'center', flex: 1, paddingVertical: 10 },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#007bff', marginBottom: 5 },
    statLabel: { fontSize: 14, color: '#6c757d', textAlign: 'center' },
    logoutButton: { backgroundColor: '#dc3545', margin: 15, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30 },
    logoutButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default ProfileScreen;