import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { especieService } from '../../services/especieService';
import { Especie } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';

type SpeciesListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SpeciesList'>;

const SpeciesListScreen = () => {
  const navigation = useNavigation<SpeciesListNavigationProp>();
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEspecies = async () => {
      try {
        const data = await especieService.getAllEspecies();
        setEspecies(data);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar a lista de espécies.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEspecies();
  }, []);

  const filteredEspecies = useMemo(() => {
    if (!searchTerm.trim()) {
      return especies;
    }
    return especies.filter(especie =>
      especie.nomeComum?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      especie.nomeCientifico.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [especies, searchTerm]);

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Pesquisar por nome comum ou científico..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      <FlatList
        data={filteredEspecies}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => navigation.navigate('SpeciesDetail', { especieId: item.id })}
          >
            <Text style={styles.listItemTitle}>{item.nomeComum || item.nomeCientifico}</Text>
            <Text style={styles.listItemSubtitle}>{item.nomeCientifico}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  listItem: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listItemTitle: { fontSize: 16, fontWeight: '500' },
  listItemSubtitle: { fontSize: 14, color: '#666', fontStyle: 'italic' },
});

export default SpeciesListScreen;