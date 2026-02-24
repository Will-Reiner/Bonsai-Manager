import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { theme } from '../../constants/theme';
import ProfileAvatar from '../../components/ProfileAvatar';
import api from '../../api';
import { Usuario } from '../../types';

type SettingsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SettingsScreen = () => {
  const navigation = useNavigation<SettingsNavigationProp>();
  const { user, logout } = useAuth();
  const [fullUser, setFullUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const response = await api.get('/auth/me');
          setFullUser(response.data);
        } catch {
          // fallback ao user do contexto
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }, [])
  );

  const displayUser = fullUser || user;
  const followers = fullUser?.seguidores?.length || 0;
  const following = fullUser?.seguindo?.length || 0;
  const plantCount = fullUser?.plantas?.length || 0;

  interface SettingsRowProps {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    label: string;
    onPress: () => void;
    color?: string;
  }

  const SettingsRow = ({ icon, label, onPress, color }: SettingsRowProps) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <MaterialCommunityIcons name={icon} size={22} color={color || theme.colors.text} />
      <Text style={[styles.rowLabel, color ? { color } : null]}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.lightGray} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Perfil Card */}
        <View style={styles.profileCard}>
          <ProfileAvatar size={72} imageUrl={displayUser?.fotoPerfilUrl} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayUser?.nomePublico || displayUser?.nome}</Text>
            <Text style={styles.profileEmail}>{displayUser?.email}</Text>
          </View>
        </View>

        {/* Estatísticas */}
        {isLoading ? (
          <ActivityIndicator style={{ padding: theme.spacing.md }} color={theme.colors.primary} />
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{plantCount}</Text>
              <Text style={styles.statLabel}>Plantas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{followers}</Text>
              <Text style={styles.statLabel}>Seguidores</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{following}</Text>
              <Text style={styles.statLabel}>A Seguir</Text>
            </View>
          </View>
        )}

        {/* Secções */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          <SettingsRow icon="account-edit" label="Editar Perfil" onPress={() => navigation.navigate('EditProfile')} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ferramentas</Text>
          <SettingsRow icon="archive-outline" label="Inventário" onPress={() => navigation.navigate('Inventory')} />
        </View>

        {displayUser?.role === 'ADMIN' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Administração</Text>
            <SettingsRow icon="shield-account" label="Painel Admin" onPress={() => navigation.navigate('Admin')} />
          </View>
        )}

        <View style={styles.section}>
          <SettingsRow
            icon="logout"
            label="Sair"
            color={theme.colors.danger}
            onPress={() => {
              Alert.alert('Sair', 'Tem a certeza que deseja sair?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', style: 'destructive', onPress: logout },
              ]);
            }}
          />
        </View>

        <View style={{ height: theme.spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.soft,
  },
  profileInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    justifyContent: 'space-around',
    ...theme.shadows.soft,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginTop: 2,
  },
  section: {
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...theme.shadows.soft,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.subtext,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
});

export default SettingsScreen;
