import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type EncyclopediaNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const EncyclopediaScreen = () => {
  const navigation = useNavigation<EncyclopediaNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Enciclopédia</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('SpeciesList')}
        >
          <Text style={styles.cardTitle}>Guia de Espécies</Text>
          <Text style={styles.cardDescription}>Encontre informações detalhadas sobre diversas espécies de bonsai.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('TechniquesList')}
        >
          <Text style={styles.cardTitle}>Guia de Técnicas</Text>
          <Text style={styles.cardDescription}>Aprenda sobre poda, aramagem, transplante e outras técnicas essenciais.</Text>
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
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#007bff',
  },
  cardDescription: {
    fontSize: 16,
    color: '#6c757d',
  },
});

export default EncyclopediaScreen;