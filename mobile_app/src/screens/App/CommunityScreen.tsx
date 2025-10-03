import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { userService } from '../../services/userService';
import { Usuario } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';
import UserListItem from '../../components/UserListItem';
import { theme } from '../../constants/theme';

// CORREÇÃO APLICADA AQUI:
// Usamos uma tipagem mais genérica que dá acesso a todas as rotas do Stack Navigator.
// Isto funciona porque a CommunityScreen, apesar de estar numa aba, pode "chamar"
// o navegador pai (o Stack) para navegar para ecrãs fora das abas.
type CommunityNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CommunityScreen = () => {
  const navigation = useNavigation<CommunityNavigationProp>();
  const [users, setUsers] = useState<Partial<Usuario>[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await userService.getAllPublicUsers();
      setUsers(data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar a lista de utilizadores.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchUsers();
    }, [fetchUsers])
  );

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users;
    }
    return users.filter(user =>
      user.nomePublico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Comunidade</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.infoText}>A carregar a comunidade...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Comunidade</Text>
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Pesquisar bonsaístas..."
        placeholderTextColor={theme.colors.subtext}
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.id!}
        renderItem={({ item }) => (
          <UserListItem
            user={item}
            onPress={() => navigation.navigate('PublicProfile', { userId: item.id! })}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum utilizador encontrado.</Text>}
        contentContainerStyle={filteredUsers.length === 0 ? styles.emptyContainer : styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: theme.colors.background 
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
    headerContainer: {
        paddingHorizontal: theme.spacing.medium,
        paddingVertical: theme.spacing.small,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.lightGray,
    },
    headerTitle: { 
      fontSize: theme.typography.h1.fontSize, 
      fontWeight: theme.typography.h1.fontWeight as any,
      color: theme.colors.text,
    },
    searchInput: {
        height: 50,
        backgroundColor: theme.colors.card,
        paddingHorizontal: theme.spacing.medium,
        margin: theme.spacing.small,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.lightGray,
        fontSize: theme.typography.body.fontSize,
        color: theme.colors.text,
    },
    list: {
      paddingVertical: theme.spacing.small,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.large,
    },
    emptyText: { 
      textAlign: 'center', 
      fontSize: theme.typography.body.fontSize, 
      color: theme.colors.subtext 
    }
});

export default CommunityScreen;