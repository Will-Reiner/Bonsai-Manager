import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { userService } from '../../services/userService';
import { Usuario } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';
import UserListItem from '../../components/UserListItem';

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
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Comunidade</Text>
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Pesquisar bonsaístas..."
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
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerContainer: {
        paddingHorizontal: 15,
        paddingTop: 15,
        paddingBottom: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: { fontSize: 28, fontWeight: 'bold' },
    searchInput: {
        height: 50,
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        margin: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 16,
    },
    emptyText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#666' }
});

export default CommunityScreen;