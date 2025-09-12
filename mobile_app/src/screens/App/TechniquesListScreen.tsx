import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { atividadeService } from '../../services/atividadeService';
import { Atividade } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';

type TechniquesListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TechniquesList'>;

const TechniquesListScreen = () => {
  const navigation = useNavigation<TechniquesListNavigationProp>();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAtividades = async () => {
      try {
        const data = await atividadeService.getAllAtividades();
        setAtividades(data);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar a lista de técnicas.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAtividades();
  }, []);

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={atividades}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => navigation.navigate('TechniqueDetail', { atividadeId: item.id, title: item.nome })}
          >
            <Text style={styles.listItemTitle}>{item.nome}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listItem: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  listItemTitle: { fontSize: 16, fontWeight: '500' },
});

export default TechniquesListScreen;