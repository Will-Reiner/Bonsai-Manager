import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { Usuario } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { theme } from '../../constants/theme';

// Componente reutilizado
const StatCard = ({ label, value, loading, onPress }: { label: string; value: string | number; loading: boolean, onPress?: () => void }) => (
  <TouchableOpacity style={styles.statCard} onPress={onPress} disabled={!onPress}>
    <Text style={styles.statValue}>{loading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : value}</Text>
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
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nome:</Text>
            <Text style={styles.infoValue}>{user?.nome}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nome Público:</Text>
            <Text style={styles.infoValue}>{user?.nomePublico || 'Não definido'}</Text>
          </View>
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

        <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.editButtonText}>Editar Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Sair (Logout)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// Estilos atualizados
const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: theme.colors.background 
    },
    headerContainer: { 
      padding: theme.spacing.large, 
      backgroundColor: theme.colors.card, 
      borderBottomWidth: 1, 
      borderBottomColor: theme.colors.lightGray 
    },
    headerTitle: { 
      fontSize: theme.typography.h1.fontSize, 
      fontWeight: theme.typography.h1.fontWeight as any,
      color: theme.colors.text,
    },
    card: { 
      backgroundColor: theme.colors.card, 
      borderRadius: 12, 
      padding: theme.spacing.large, 
      marginHorizontal: theme.spacing.medium, 
      marginTop: theme.spacing.large, 
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.05, 
      shadowRadius: 5, 
      elevation: 3 
    },
    cardTitle: { 
      fontSize: 20, 
      fontWeight: 'bold', 
      marginBottom: theme.spacing.medium, 
      color: theme.colors.text 
    },
    infoRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      paddingVertical: theme.spacing.small 
    },
    infoLabel: { 
      fontSize: theme.typography.body.fontSize, 
      color: theme.colors.subtext 
    },
    infoValue: { 
      fontSize: theme.typography.body.fontSize, 
      fontWeight: '500',
      color: theme.colors.text,
    },
    statsContainer: { 
      flexDirection: 'row', 
      justifyContent: 'space-around' 
    },
    statCard: { 
      alignItems: 'center', 
      flex: 1, 
      paddingVertical: theme.spacing.small 
    },
    statValue: { 
      fontSize: 24, 
      fontWeight: 'bold', 
      color: theme.colors.primary, 
      marginBottom: 5 
    },
    statLabel: { 
      fontSize: 14, 
      color: theme.colors.subtext, 
      textAlign: 'center' 
    },
    editButton: {
      backgroundColor: theme.colors.primary,
      margin: theme.spacing.medium,
      padding: theme.spacing.medium,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: theme.spacing.large
    },
    editButtonText: {
      color: theme.colors.card,
      fontWeight: 'bold',
      fontSize: theme.typography.body.fontSize
    },
    logoutButton: {
      backgroundColor: theme.colors.danger,
      margin: theme.spacing.medium,
      padding: theme.spacing.medium,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: theme.spacing.small
    },
    logoutButtonText: { 
      color: theme.colors.card, 
      fontWeight: 'bold', 
      fontSize: theme.typography.body.fontSize 
    },
});

export default ProfileScreen;