import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { atividadeService } from '../../services/atividadeService';
import { Atividade } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { theme } from '../../constants/theme';

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
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: theme.colors.background
  },
  listItem: { 
    backgroundColor: theme.colors.card, 
    padding: theme.spacing.lg, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.lightGray 
  },
  listItemTitle: { 
    fontSize: 16, 
    fontWeight: '500',
    color: theme.colors.text
  },
});

export default TechniquesListScreen;